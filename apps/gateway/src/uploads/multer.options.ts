export const getMulterUploadOptions = () => ({
  limits: {
    fileSize:
      parseInt(process.env.MAX_UPLOAD_BYTES ?? '', 10) || 10 * 1024 * 1024,
  },
});
