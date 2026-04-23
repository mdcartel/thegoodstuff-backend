import { AbstractFileProviderService } from "@medusajs/framework/utils"
import type { FileTypes, Logger } from "@medusajs/framework/types"
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary"

type CloudinaryOptions = {
    cloud_name: string
    api_key: string
    api_secret: string
    secure?: boolean
}

type InjectedDependencies = {
    logger: Logger
}

class CloudinaryFileProviderService extends AbstractFileProviderService {
    static identifier = "cloudinary"

    protected logger_: Logger
    protected options_: CloudinaryOptions

    constructor({ logger }: InjectedDependencies, options: CloudinaryOptions) {
        super()
        this.logger_ = logger
        this.options_ = options

        cloudinary.config({
            cloud_name: options.cloud_name,
            api_key: options.api_key,
            api_secret: options.api_secret,
            secure: options.secure ?? true,
        })

        this.logger_.info("Cloudinary file provider initialized")
    }

    async upload(
        file: FileTypes.ProviderUploadFileDTO
    ): Promise<FileTypes.ProviderFileResultDTO> {
        this.logger_.info(
            `Uploading file to Cloudinary: ${file.filename} (${file.mimeType})`
        )

        // Convert base64 content to a Buffer and stream it directly to Cloudinary.
        // This avoids the memory overhead of base64 data URIs and is significantly faster.
        const buffer = Buffer.from(file.content, "base64")

        const result = await new Promise<UploadApiResponse>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "auto",
                    folder: "medusa",
                    public_id: file.filename?.replace(/\.[^/.]+$/, ""),
                },
                (error, result) => {
                    if (error) {
                        this.logger_.error(
                            `Cloudinary upload failed: ${error.message}`
                        )
                        reject(error)
                        return
                    }
                    resolve(result!)
                }
            )
            uploadStream.end(buffer)
        })

        this.logger_.info(
            `File uploaded to Cloudinary: ${result.secure_url}`
        )

        return {
            url: result.secure_url,
            key: result.public_id,
        }
    }

    async delete(
        file: FileTypes.ProviderDeleteFileDTO
    ): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            cloudinary.uploader.destroy(
                file.fileKey,
                { resource_type: "image" },
                (error) => {
                    if (error) {
                        this.logger_.error(
                            `Failed to delete file from Cloudinary: ${error.message}`
                        )
                        reject(error)
                    }
                    resolve()
                }
            )
        })
    }

    async getPresignedDownloadUrl(
        fileData: FileTypes.ProviderGetFileDTO
    ): Promise<string> {
        // Cloudinary URLs are already publicly accessible
        const url = cloudinary.url(fileData.fileKey, {
            secure: true,
            resource_type: "auto",
        })
        return url
    }
}

export default CloudinaryFileProviderService
