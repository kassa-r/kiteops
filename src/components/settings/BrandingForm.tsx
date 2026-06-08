'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useUpdateSchoolSettings } from '@/lib/hooks/useSchoolSettings';
import { uploadSchoolLogo } from '@/lib/settings-service';
import { useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';

interface BrandingFormProps {
  initialLogoUrl?: string;
}

export function BrandingForm({ initialLogoUrl }: BrandingFormProps) {
  const updateSettings = useUpdateSchoolSettings();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialLogoUrl);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type/size if needed (e.g. < 2MB, image/*)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const publicUrl = await uploadSchoolLogo(file);
      setPreviewUrl(publicUrl);
      
      // Update settings immediately with new URL
      updateSettings.mutate({ school_logo_url: publicUrl });
      toast.success('Logo uploaded and settings updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>Upload your school's logo.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 border rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden relative">
              {previewUrl ? (
                <Image 
                  src={previewUrl} 
                  alt="School Logo" 
                  fill 
                  className="object-contain p-2"
                />
              ) : (
                <span className="text-muted-foreground text-xs">No Logo</span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-upload">Upload Logo</Label>
              <Input 
                id="logo-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">Recommended size: 200x200px. Max 2MB.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
