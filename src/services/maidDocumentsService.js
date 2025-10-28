import { supabase } from '@/lib/databaseClient';

export const maidDocumentsService = {
  async listDocuments(maidId) {
    try {
      const { data, error } = await supabase
        .from('maid_documents')
        .select('*')
        .eq('maid_id', maidId)
        .order('uploaded_at', { ascending: false });
      return { data: data || [], error };
    } catch (error) {
      console.error('Error listing maid documents:', error);
      return { data: [], error };
    }
  },

  async uploadDocument(maidId, { file, type, customTypeName = '', title = '', description = '' }) {
    try {
      if (!file || !maidId || !type) throw new Error('Missing file, maidId or type');
      const safeName = (file.name || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `maids/${maidId}/documents/${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl || '';
      if (!publicUrl) throw new Error('Failed to get public URL');

      const insert = {
        maid_id: maidId,
        type,
        custom_type_name: customTypeName || null,
        title: title || file.name,
        description: description || null,
        file_path: filePath,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      };

      const { data: row, error } = await supabase
        .from('maid_documents')
        .insert([insert])
        .select('*')
        .single();
      if (error) throw error;
      return { data: row, error: null };
    } catch (error) {
      console.error('Error uploading maid document:', error);
      return { data: null, error };
    }
  },

  async deleteDocument(maidId, document) {
    try {
      const path = document.file_path || document.path;
      if (path) {
        const { error: removeError } = await supabase.storage
          .from('user-uploads')
          .remove([path]);
        if (removeError) throw removeError;
      }

      const { error } = await supabase
        .from('maid_documents')
        .delete()
        .eq('id', document.id)
        .eq('maid_id', maidId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting maid document:', error);
      return { success: false, error };
    }
  },
};

export default maidDocumentsService;

