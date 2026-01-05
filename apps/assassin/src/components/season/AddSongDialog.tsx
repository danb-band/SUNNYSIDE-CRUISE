"use client";

import { useState } from "react";
import { useCreateSong } from "@features/song/mutations/useCreateSong";
import { useSongsBySeason } from "@features/song/queries/useSongsBySeason";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddSongDialogProps {
  seasonId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSongDialog({
  seasonId,
  open,
  onOpenChange,
}: AddSongDialogProps) {
  const { data: songs } = useSongsBySeason(seasonId);
  const createSong = useCreateSong();

  const [formData, setFormData] = useState({
    name: "",
    artist: "",
    description: "",
    youtubeUrl: "",
    writer: "",
    deletePw: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createSong.mutateAsync({
        seasonId,
        name: formData.name,
        artist: formData.artist,
        description: formData.description,
        youtubeUrl: formData.youtubeUrl,
        writer: formData.writer,
        deletePw: formData.deletePw,
        sortOrder: songs.length,
      });

      setFormData({
        name: "",
        artist: "",
        description: "",
        youtubeUrl: "",
        writer: "",
        deletePw: "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create song:", error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>노래 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">곡명 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist">아티스트 *</Label>
            <Input
              id="artist"
              value={formData.artist}
              onChange={(e) => handleChange("artist", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtubeUrl">유튜브 URL *</Label>
            <Input
              id="youtubeUrl"
              type="url"
              value={formData.youtubeUrl}
              onChange={(e) => handleChange("youtubeUrl", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="writer">작성자 *</Label>
            <Input
              id="writer"
              value={formData.writer}
              onChange={(e) => handleChange("writer", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deletePw">삭제 비밀번호 *</Label>
            <Input
              id="deletePw"
              type="password"
              value={formData.deletePw}
              onChange={(e) => handleChange("deletePw", e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={createSong.isPending}>
              {createSong.isPending ? "추가 중..." : "추가"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
