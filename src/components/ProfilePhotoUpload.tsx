import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  userName?: string;
  onPhotoUpdated?: (url: string) => void;
}

export function ProfilePhotoUpload({ currentPhotoUrl, userName, onPhotoUpdated }: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getInitials = (name?: string) => {
    if (!name) return "RN";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPG, PNG, or WEBP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete old photo if exists
      if (photoUrl) {
        const oldPath = photoUrl.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("profile-photos")
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new photo
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      // Update profile with photo URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_photo_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setPhotoUrl(publicUrl);
      onPhotoUpdated?.(publicUrl);

      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated successfully.",
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoUrl) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete photo from storage
      const oldPath = photoUrl.split("/").pop();
      if (oldPath) {
        await supabase.storage
          .from("profile-photos")
          .remove([`${user.id}/${oldPath}`]);
      }

      // Update profile to remove photo URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_photo_url: null })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setPhotoUrl(null);
      onPhotoUpdated?.("");

      toast({
        title: "Photo Removed",
        description: "Your profile photo has been removed.",
      });
    } catch (error) {
      console.error("Error removing photo:", error);
      toast({
        title: "Remove Failed",
        description: "Failed to remove photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Profile Photo
        </CardTitle>
        <CardDescription>
          Upload a professional photo to help clients and attorneys recognize you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription className="text-sm">
            Your photo will be visible to clients and attorneys you work with. Please use a professional headshot.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-6">
          <Avatar className="h-32 w-32 border-4 border-border">
            <AvatarImage src={photoUrl || undefined} alt={userName || "Profile"} />
            <AvatarFallback className="text-2xl">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {photoUrl ? "Change Photo" : "Upload Photo"}
                </>
              )}
            </Button>

            {photoUrl && (
              <Button
                onClick={handleRemovePhoto}
                disabled={uploading}
                variant="outline"
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                Remove Photo
              </Button>
            )}

            <p className="text-xs text-muted-foreground">
              Accepted formats: JPG, PNG, WEBP • Max size: 5MB
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}