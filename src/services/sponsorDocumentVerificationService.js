import { supabase } from '@/lib/databaseClient';

import { createLogger } from '@/utils/logger';
const log = createLogger('SponsorDocVerify');

class SponsorDocumentVerificationService {
  constructor() {
    this.tableName = 'sponsor_document_verification';
    this.bucketName = 'sponsor-documents';
  }

  /**
   * Upload a document file to Supabase storage
   */
  async uploadDocument(file, userId, documentType) {
    try {
      if (!file || !userId || !documentType) {
        throw new Error('Missing required parameters for document upload');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${documentType}_${timestamp}.${fileExtension}`;
      const filePath = `${userId}/${fileName}`;

      log.info(
        'Document Upload',
        `Uploading ${documentType} for user ${userId}`
      );

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        log.error('Document Upload Error', uploadError);
        throw uploadError;
      }

      // Get public URL (even though bucket is private, we need the path)
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      };
    } catch (error) {
      log.error('Document Upload Service Error', error);
      throw error;
    }
  }

  /**
   * Save or update sponsor document verification data
   */
  async saveVerificationData(userId, verificationData) {
    try {
      log.info(
        'Verification Data Save',
        `Saving verification data for user ${userId}`
      );

      // Check if record exists
      const { data: existingRecord, error: fetchError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('sponsor_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const dataToSave = {
        sponsor_id: userId,
        id_type: verificationData.idType,
        id_number: verificationData.idNumber,
        residence_country: verificationData.residenceCountry,
        contact_phone: verificationData.contactPhone,
        employment_proof_type: verificationData.employmentProofType,
        verification_status: 'pending',
        last_submission_at: new Date().toISOString(),
      };

      // Add document URLs if they exist
      if (verificationData.idFileFront) {
        dataToSave.id_file_front_url = verificationData.idFileFront.url;
        dataToSave.id_file_front_name = verificationData.idFileFront.name;
        dataToSave.id_file_front_size = verificationData.idFileFront.size;
        dataToSave.id_file_front_mime_type =
          verificationData.idFileFront.mimeType;
      }

      if (verificationData.idFileBack) {
        dataToSave.id_file_back_url = verificationData.idFileBack.url;
        dataToSave.id_file_back_name = verificationData.idFileBack.name;
        dataToSave.id_file_back_size = verificationData.idFileBack.size;
        dataToSave.id_file_back_mime_type =
          verificationData.idFileBack.mimeType;
      }

      if (verificationData.employmentProofFile) {
        dataToSave.employment_proof_url =
          verificationData.employmentProofFile.url;
        dataToSave.employment_proof_name =
          verificationData.employmentProofFile.name;
        dataToSave.employment_proof_size =
          verificationData.employmentProofFile.size;
        dataToSave.employment_proof_mime_type =
          verificationData.employmentProofFile.mimeType;
      }

      let result;
      if (existingRecord) {
        // Update existing record
        dataToSave.submission_count =
          (existingRecord.submission_count || 0) + 1;
        const { data, error } = await supabase
          .from(this.tableName)
          .update(dataToSave)
          .eq('sponsor_id', userId)
          .select()
          .single();

        if (error) throw error;
        result = data;
        log.info(
          'Verification Data Updated',
          `Updated verification for user ${userId}`
        );
      } else {
        // Insert new record
        dataToSave.submission_count = 1;
        const { data, error } = await supabase
          .from(this.tableName)
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;
        result = data;
        log.info(
          'Verification Data Created',
          `Created verification for user ${userId}`
        );
      }

      return result;
    } catch (error) {
      log.error('Verification Data Save Error', error);
      throw error;
    }
  }

  /**
   * Get sponsor verification data
   */
  async getVerificationData(userId) {
    try {
      log.info(
        'Verification Data Fetch',
        `Fetching verification data for user ${userId}`
      );

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('sponsor_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      log.error('Verification Data Fetch Error', error);
      throw error;
    }
  }

  /**
   * Get verification summary
   */
  async getVerificationSummary(userId) {
    try {
      const { data, error } = await supabase.rpc(
        'get_sponsor_verification_summary',
        { sponsor_uuid: userId }
      );

      if (error) throw error;

      return (
        data[0] || {
          has_documents: false,
          verification_status: 'not_submitted',
          documents_complete: false,
          missing_documents: ['All documents required'],
        }
      );
    } catch (error) {
      log.error('Verification Summary Error', error);
      return {
        has_documents: false,
        verification_status: 'error',
        documents_complete: false,
        missing_documents: ['Error fetching status'],
      };
    }
  }

  /**
   * Delete a document file
   */
  async deleteDocument(filePath) {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) throw error;

      log.info('Document Deleted', `Deleted document: ${filePath}`);
      return true;
    } catch (error) {
      log.error('Document Delete Error', error);
      throw error;
    }
  }

  /**
   * Get signed URL for viewing a document (for admins)
   */
  async getDocumentSignedUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      log.error('Signed URL Error', error);
      throw error;
    }
  }

  /**
   * Process complete verification submission
   */
  async submitCompleteVerification(userId, verificationData) {
    try {
      log.info(
        'Complete Verification Submission',
        `Processing complete submission for user ${userId}`
      );

      // Upload all documents first
      const uploadPromises = [];
      const uploadedDocuments = {};

      if (verificationData.idFileFront?.file) {
        uploadPromises.push(
          this.uploadDocument(
            verificationData.idFileFront.file,
            userId,
            'id_front'
          ).then((result) => {
            uploadedDocuments.idFileFront = result;
          })
        );
      }

      if (verificationData.idFileBack?.file) {
        uploadPromises.push(
          this.uploadDocument(
            verificationData.idFileBack.file,
            userId,
            'id_back'
          ).then((result) => {
            uploadedDocuments.idFileBack = result;
          })
        );
      }

      if (verificationData.employmentProofFile?.file) {
        uploadPromises.push(
          this.uploadDocument(
            verificationData.employmentProofFile.file,
            userId,
            'employment_proof'
          ).then((result) => {
            uploadedDocuments.employmentProofFile = result;
          })
        );
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Merge uploaded document data with verification data
      const completeVerificationData = {
        ...verificationData,
        ...uploadedDocuments,
      };

      // Save verification data to database
      const result = await this.saveVerificationData(
        userId,
        completeVerificationData
      );

      log.info(
        'Complete Verification Success',
        `Successfully submitted verification for user ${userId}`
      );
      return result;
    } catch (error) {
      log.error('Complete Verification Error', error);
      throw error;
    }
  }
}

// Export singleton instance
export const sponsorDocumentVerificationService =
  new SponsorDocumentVerificationService();
export default sponsorDocumentVerificationService;
