import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class VectorService {
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or Key is not defined in the environment variables.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async saveEmbedding(postId: number, embedding: number[], content: string): Promise<void> {
    const { error } = await this.supabase.from('post_embeddings').insert({
      post_id: postId,
      embedding: embedding,
      content: content, // Storing content for context is good practice
    });

    if (error) {
      console.error('Error saving embedding to Supabase:', error);
      throw new InternalServerErrorException('Failed to save embedding to Supabase.');
    }
  }

  async updateEmbedding(postId: number, embedding: number[], content: string): Promise<void> {
    const { error } = await this.supabase
      .from('post_embeddings')
      .update({ embedding, content })
      .eq('post_id', postId);

    if (error) {
      console.error('Error updating embedding in Supabase:', error);
      throw new InternalServerErrorException('Failed to update embedding.');
    }
  }

  async deleteEmbedding(postId: number): Promise<void> {
    const { error } = await this.supabase
      .from('post_embeddings')
      .delete()
      .eq('post_id', postId);

    if (error) {
      console.error('Error deleting embedding from Supabase:', error);
      throw new InternalServerErrorException('Failed to delete embedding.');
    }
  }

  async getEmbeddingByPostId(postId: number): Promise<number[]> {
    const { data, error } = await this.supabase
      .from('post_embeddings')
      .select('embedding')
      .eq('post_id', postId)
      .single();

    if (error || !data) {
      console.error('Error fetching embedding:', error);
      throw new InternalServerErrorException(`Could not find embedding for post ID ${postId}`);
    }

    return data.embedding;
  }

  async getEmbeddingsByPostIds(postIds: number[]): Promise<{ post_id: number; embedding: number[] }[]> {
    if (postIds.length === 0) {
      return [];
    }
    const { data, error } = await this.supabase
      .from('post_embeddings')
      .select('post_id, embedding')
      .in('post_id', postIds);

    if (error) {
      console.error('Error fetching embeddings by IDs:', error);
      throw new InternalServerErrorException('Could not fetch embeddings.');
    }

    return data || [];
  }

  async getAllEmbeddings(): Promise<{ post_id: number; embedding: number[] }[]> {
    const { data, error } = await this.supabase
      .from('post_embeddings')
      .select('post_id, embedding');

    if (error) {
      console.error('Error fetching all embeddings:', error);
      throw new InternalServerErrorException('Could not fetch all embeddings.');
    }

    return data || [];
  }

  async searchSimilarPosts(
    embedding: number[],
    match_threshold = 0.78, // Default threshold
    match_count = 5,      // Default count
  ): Promise<{ post_id: number; similarity: number }[]> {
    const { data, error } = await this.supabase.rpc('match_posts', {
      query_embedding: embedding,
      match_threshold: match_threshold,
      match_count: match_count,
    });

    if (error) {
      console.error('Error searching for similar posts:', error);
      throw new InternalServerErrorException('Failed to search for similar posts.');
    }

    return data || [];
  }
}