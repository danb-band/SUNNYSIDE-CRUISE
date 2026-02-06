"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Music, User, Link2, FileText, Loader2, Pencil, Trash2, Save, X } from "lucide-react";
import { cn } from "@/libs/shadcn/utils";
import { useSongHandlers } from "@/features/song/hooks/useSongHandlers";
import type { Song } from "@features/song/schema";

interface SongDetailContentProps {
  song: Song;
  onClose: () => void;
}

export function extractYoutubeId(url: string): string | null {
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

export function SongDetailContent({ song, onClose }: SongDetailContentProps) {
  const [isEditing, setIsEditing] = useState(false);

  const { formState, isProcessing, handleSubmit, handleChangeField, handleDeleteSong } =
    useSongHandlers({
      mode: "update",
      songId: song.id,
      initialData: {
        seasonId: song.seasonId,
        name: song.name,
        artist: song.artist,
        description: song.description,
        youtubeUrl: song.youtubeUrl,
        sortOrder: song.sortOrder,
      },
    });

  const { formData, errors } = formState;
  const savedDataRef = useRef(formData);

  const handleStartEditing = () => {
    savedDataRef.current = { ...formData };
    setIsEditing(true);
  };

  const handleSave = async () => {
    const result = await handleSubmit();
    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    handleChangeField("name", savedDataRef.current.name);
    handleChangeField("artist", savedDataRef.current.artist);
    handleChangeField("youtubeUrl", savedDataRef.current.youtubeUrl);
    handleChangeField("description", savedDataRef.current.description);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("정말로 이 곡을 삭제하시겠습니까?")) return;
    const result = await handleDeleteSong(song.id);
    if (result.success) {
      onClose();
    }
  };

  const inputClassName =
    "h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 text-sm placeholder:text-slate-400";

  return (
    <>
      <div className="px-4 sm:px-5 py-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="edit-name"
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  <Music className="h-3.5 w-3.5" />
                  곡명
                </label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleChangeField("name", e.target.value)}
                  placeholder="노래 제목"
                  className={inputClassName}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="edit-artist"
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  <User className="h-3.5 w-3.5" />
                  아티스트
                </label>
                <Input
                  id="edit-artist"
                  value={formData.artist}
                  onChange={(e) => handleChangeField("artist", e.target.value)}
                  placeholder="아티스트명"
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="edit-youtubeUrl"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                <Link2 className="h-3.5 w-3.5" />
                유튜브 URL
              </label>
              <Input
                id="edit-youtubeUrl"
                type="url"
                value={formData.youtubeUrl}
                onChange={(e) => handleChangeField("youtubeUrl", e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className={inputClassName}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="edit-description"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                <FileText className="h-3.5 w-3.5" />
                설명
              </label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleChangeField("description", e.target.value)}
                placeholder="이 노래에 대해 하고 싶은 말 (선택)"
                className={cn(inputClassName, "min-h-[80px] resize-none")}
              />
            </div>

            {errors._root && <p className="text-xs text-red-500">{errors._root}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isProcessing}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-50 dark:hover:bg-slate-700"
              >
                <X className="mr-1 h-3.5 w-3.5" />
                취소
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isProcessing}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="mr-1 h-3.5 w-3.5" />
                    저장
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                    {formData.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {formData.artist}
                  </span>
                </div>
                {formData.description && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap">
                      {formData.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  onClick={handleStartEditing}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                  onClick={handleDelete}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
