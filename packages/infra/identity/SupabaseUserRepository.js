/**
 * SupabaseUserRepository - Implements UserRepository port
 *
 * Adapter for Supabase database operations.
 */

import { UserRepository } from '@ethio-maids/app-identity';
import { User, UserRole } from '@ethio-maids/domain-identity';

export class SupabaseUserRepository extends UserRepository {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return this._mapToEntity(data);
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find user by email: ${error.message}`);
    }

    return this._mapToEntity(data);
  }

  /**
   * Find user by phone number
   */
  async findByPhoneNumber(phoneNumber) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('phone', phoneNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find user by phone: ${error.message}`);
    }

    return this._mapToEntity(data);
  }

  /**
   * Save user (insert or update)
   */
  async save(user) {
    const record = this._mapToRecord(user);

    const { data, error } = await this.supabase
      .from('profiles')
      .upsert(record, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save user: ${error.message}`);
    }

    return this._mapToEntity(data);
  }

  /**
   * Delete user (soft delete)
   */
  async delete(id) {
    const { error } = await this.supabase
      .from('profiles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to check email existence: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Get users by role with pagination
   */
  async findByRole(role, options = {}) {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    // Get total count
    const { count } = await this.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', role);

    // Get paginated data
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('user_type', role)
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find users by role: ${error.message}`);
    }

    const users = data.map(record => this._mapToEntity(record));

    return { users, total: count || 0 };
  }

  /**
   * Map database record to User entity
   */
  _mapToEntity(record) {
    if (!record) return null;

    return new User({
      id: record.id,
      email: record.email,
      emailVerified: record.registration_complete || false,
      phoneNumber: record.phone,
      phoneVerified: false, // Need to check phone_verifications table
      role: UserRole.fromString(record.user_type),
      status: record.is_active ? 'active' : 'suspended',
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    });
  }

  /**
   * Map User entity to database record
   */
  _mapToRecord(user) {
    return {
      id: user.id,
      email: user.email,
      user_type: user.role.name,
      phone: user.phoneNumber,
      registration_complete: user.emailVerified,
      is_active: user.status === 'active',
      updated_at: new Date().toISOString(),
    };
  }
}
