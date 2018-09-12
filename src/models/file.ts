import * as mongoose from "mongoose";

export interface IFileDocument extends mongoose.Document {
    url: string;
    mime: string;
    thumbnail?: string;
}

export const FileSchema = new mongoose.Schema(
    {
        url: String,
        mime: String,
        thumbnail: String,
    },
    {
        timestamps: true,
    },
);

FileSchema.method("toJSON", function() {
    return {
        url: this.url || "",
        thumbnail: this.thumbnail || null,
        mime: this.mime || null,
    };
});
