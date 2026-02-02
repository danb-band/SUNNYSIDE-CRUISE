"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Music, User, Link2, FileText, Loader2, Plus } from "lucide-react";
import { cn } from "@/libs/shadcn/utils";
import { useSongHandlers } from "@/features/song/hooks/useSongHandlers";
import { useSongLogic } from "@/features/song/hooks/useSongLogic";
import type { Song } from "@features/song/schema";

interface AddSongDialogProps {
  seasonId: string;
  initialSongs: Song[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function FormField({ label, htmlFor, required, icon, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        {icon}
        {label}
        {required && <span className="text-blue-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export function AddSongDialog({ seasonId, initialSongs, open, onOpenChange }: AddSongDialogProps) {
  const { validateSongData, getNextSortOrder } = useSongLogic(seasonId, initialSongs);

  const { formState, isProcessing, handleSubmit, handleChangeField } = useSongHandlers({
    mode: "create",
    initialData: {
      seasonId,
      sortOrder: getNextSortOrder(),
    },
  });

  const { formData } = formState;

  const youtubeId = extractYoutubeId(formData.youtubeUrl);

  const inputClassName =
    "h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 text-sm placeholder:text-slate-400";

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen: boolean) => {
        onOpenChange(isOpen);
      }}
    >
      <DialogContent
        className={cn(
          "w-full max-w-[calc(100%-1.5rem)] sm:max-w-md p-0 gap-0 overflow-hidden",
          "bg-slate-50 dark:bg-slate-800",
          "border-slate-200 dark:border-slate-700",
        )}
      >
        {/* Header */}
        <DialogHeader className="px-4 sm:px-5 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-blue-500">
              <Music className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
              새 노래 추가
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Form Content */}
          <div className="px-4 sm:px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Song Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                label="곡명"
                htmlFor="name"
                required
                icon={<Music className="h-3.5 w-3.5" />}
              >
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChangeField("name", e.target.value)}
                  placeholder="노래 제목"
                  className={inputClassName}
                />
              </FormField>

              <FormField
                label="아티스트"
                htmlFor="artist"
                required
                icon={<User className="h-3.5 w-3.5" />}
              >
                <Input
                  id="artist"
                  value={formData.artist}
                  onChange={(e) => handleChangeField("artist", e.target.value)}
                  placeholder="아티스트명"
                  className={inputClassName}
                />
              </FormField>
            </div>

            <FormField
              label="유튜브 URL"
              htmlFor="youtubeUrl"
              required
              icon={<Link2 className="h-3.5 w-3.5" />}
            >
              <Input
                id="youtubeUrl"
                type="url"
                value={formData.youtubeUrl}
                onChange={(e) => handleChangeField("youtubeUrl", e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className={inputClassName}
              />
            </FormField>

            {/* YouTube Preview */}
            {youtubeId && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-900">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="YouTube video preview"
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <FormField
              label="설명"
              htmlFor="description"
              icon={<FileText className="h-3.5 w-3.5" />}
            >
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChangeField("description", e.target.value)}
                placeholder="이 노래에 대해 하고 싶은 말 (선택)"
                className={cn(inputClassName, "min-h-[80px] resize-none")}
              />
            </FormField>

            {/* Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-50 dark:bg-slate-800 px-2 text-xs text-slate-400">
                  작성자 정보
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-5 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-50 dark:hover:bg-slate-700"
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!validateSongData(formData).isValid || isProcessing}
              className="bg-blue-500 hover:bg-blue-600 text-white min-w-[90px] w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  추가 중...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  추가하기
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
