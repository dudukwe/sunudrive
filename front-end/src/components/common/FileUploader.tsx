import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Paper, Typography, Box, Button, LinearProgress, Chip, TextField, Stack } from '@mui/material';
import { CloudUpload, InsertDriveFile } from '@mui/icons-material';
import { useFileStore } from '../../store/fileStore';

interface FileUploaderProps {
  onUploadComplete?: () => void;
}

const FileUploader = ({ onUploadComplete }: FileUploaderProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const { uploadFile, currentFolder } = useFileStore();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles);
    if (acceptedFiles.length > 0) {
      // Use the filename as the default title (without extension)
      const fileName = acceptedFiles[0].name;
      const titleWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      setTitle(titleWithoutExt);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });
  
  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;
    
    setUploading(true);
    setProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFiles[0]);
      formData.append('title', title || uploadedFiles[0].name);
      
      if (tags.length > 0) {
        formData.append('tags', JSON.stringify(tags));
      }
      
      if (currentFolder) {
        formData.append('folder', currentFolder.id);
      }
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + 10;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);
      
      await uploadFile(formData);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setUploading(false);
        setUploadedFiles([]);
        setTitle('');
        setTags([]);
        setProgress(0);
        if (onUploadComplete) onUploadComplete();
      }, 1000);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
    }
  };
  
  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };
  
  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter((tag) => tag !== tagToDelete));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag) {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'divider',
        backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
        transition: 'all 0.3s ease',
      }}
    >
      {!uploadedFiles.length ? (
        <Box
          {...getRootProps()}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            cursor: 'pointer',
          }}
        >
          <input {...getInputProps()} />
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" align="center" gutterBottom>
            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </Typography>
          <Typography variant="body2" align="center" color="textSecondary">
            or click to select files
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InsertDriveFile sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="body1" noWrap>
              {uploadedFiles[0].name} ({formatFileSize(uploadedFiles[0].size)})
            </Typography>
          </Box>
          
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
            disabled={uploading}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
            <TextField
              label="Add tags"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={uploading}
              size="small"
              sx={{ mr: 1, flexGrow: 1 }}
            />
            <Button 
              variant="outlined" 
              onClick={handleAddTag}
              disabled={!currentTag || uploading}
              size="small"
            >
              Add
            </Button>
          </Box>
          
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, my: 2 }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleDeleteTag(tag)}
                disabled={uploading}
                size="small"
              />
            ))}
          </Stack>
          
          {uploading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
                {progress === 100 ? 'Upload complete!' : `Uploading... ${progress}%`}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setUploadedFiles([]);
                setTitle('');
                setTags([]);
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={uploading || !title}
            >
              Upload
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileUploader;