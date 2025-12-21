"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface EvidenceUploaderProps {
  assessmentId: string;
  orgId: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "text/csv": [".csv"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function EvidenceUploader({ assessmentId, orgId }: EvidenceUploaderProps) {
  const router = useRouter();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const uploadFile = async (file: File): Promise<void> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Generate unique file path
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${orgId}/${assessmentId}/${timestamp}_${safeName}`;

    // Get file extension
    const extension = file.name.split(".").pop()?.toLowerCase() || "";

    try {
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("evidence")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create evidence record
      const { error: dbError } = await supabase.from("evidence").insert({
        assessment_id: assessmentId,
        org_id: orgId,
        file_path: filePath,
        file_name: file.name,
        file_type: extension,
        status: "uploaded",
        created_by: user?.id,
        meta: {
          size: file.size,
          type: file.type,
        },
      });

      if (dbError) throw dbError;

      // Update file status
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file ? { ...f, status: "success" as const, progress: 100 } : f
        )
      );
    } catch (error) {
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? {
                ...f,
                status: "error" as const,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Validate files
      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > MAX_FILE_SIZE) {
          console.warn(`File ${file.name} exceeds 10MB limit`);
          return false;
        }
        return true;
      });

      // Add files to upload queue
      const newFiles: UploadingFile[] = validFiles.map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const,
      }));

      setUploadingFiles((prev) => [...prev, ...newFiles]);

      // Upload files in parallel
      await Promise.all(validFiles.map(uploadFile));

      // Refresh page after uploads
      router.refresh();
    },
    [assessmentId, orgId, router]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
  });

  const removeFile = (file: File) => {
    setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
  };

  const activeUploads = uploadingFiles.filter((f) => f.status === "uploading");
  const hasUploads = uploadingFiles.length > 0;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              "p-4 rounded-full",
              isDragActive ? "bg-primary/10" : "bg-muted"
            )}
          >
            <Upload
              className={cn(
                "h-8 w-8",
                isDragActive ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <div>
            <p className="font-medium">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse. PDF, DOC, DOCX, images, CSV (max 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {hasUploads && (
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {uploadingFiles.map((item, index) => (
            <div key={index} className="flex items-center gap-4 p-4">
              {item.status === "uploading" && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              {item.status === "success" && (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              )}
              {item.status === "error" && (
                <AlertCircle className="h-5 w-5 text-rose-400" />
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.file.name}</p>
                {item.status === "uploading" && (
                  <div className="w-full bg-muted rounded-full h-1 mt-2">
                    <div
                      className="bg-primary h-1 rounded-full transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {item.error && (
                  <p className="text-sm text-rose-400">{item.error}</p>
                )}
              </div>

              {item.status !== "uploading" && (
                <button
                  onClick={() => removeFile(item.file)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Status */}
      {activeUploads.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Uploading {activeUploads.length} file(s)...
        </p>
      )}
    </div>
  );
}

