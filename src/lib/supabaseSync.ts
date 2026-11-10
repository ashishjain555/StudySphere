import { supabase, isSupabaseConfigured } from './supabase';
import {
  StudyMaterial,
  Subject,
  StudyPlanTask,
  QuizAttempt,
  WeakTopic,
  ChatMessage,
  UserFeedback,
} from '../types';
import {
  SAMPLE_QUIZ_BANK,
} from './dataStore';

/**
 * Returns current authenticated Supabase user's UUID if available.
 */
async function getAuthUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Validates if string is a valid UUID format; returns null otherwise to avoid Postgres syntax error.
 */
export function toValidUUID(id?: string | null): string | null {
  if (!id) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id) ? id : null;
}

/**
 * Synchronizes user-created custom subject directly to Supabase
 */
export async function syncSubjectToSupabase(subject: Subject): Promise<void> {
  if (!isSupabaseConfigured || !subject.id) return;
  try {
    const payload = {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      icon: subject.icon || 'BookOpen',
      progress_percentage: subject.progressPercentage || 0,
      topic_count: subject.topicCount || 0,
      units_count: subject.unitsCount || 4,
      color: subject.color || 'from-indigo-500 to-violet-600',
    };
    await supabase.from('subjects').upsert(payload, { onConflict: 'id' });
  } catch (err) {
    console.warn('Subject sync error:', err);
  }
}

/**
 * Deletes subject from Supabase
 */
export async function deleteSubjectFromSupabase(subjectId: string): Promise<void> {
  if (!isSupabaseConfigured || !subjectId) return;
  try {
    await supabase.from('subjects').delete().eq('id', subjectId);
  } catch (err) {
    console.warn('Subject delete error:', err);
  }
}

/**
 * Helper to ensure a parent subject exists in Supabase so foreign key constraints pass.
 */
export async function ensureSubjectExistsInSupabase(subjectId: string, subjectName?: string): Promise<void> {
  if (!isSupabaseConfigured || !subjectId) return;
  try {
    const payload = {
      id: subjectId,
      name: subjectName || 'General Course',
      code: 'GEN-101',
      description: `Course syllabus for ${subjectName || 'General Studies'}`,
      icon: 'BookOpen',
      progress_percentage: 0,
      topic_count: 4,
      units_count: 4,
      color: 'from-blue-500 to-indigo-600',
    };
    await supabase.from('subjects').upsert(payload, { onConflict: 'id' });
  } catch {
    // Non-blocking
  }
}

/**
 * Automatically seeds Quiz Questions bank into Supabase on first run if empty.
 * (Sample subjects and dummy PDFs are not force-seeded per user preference).
 */
export async function autoSeedCurriculumToSupabase(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    // Clean up any legacy dummy materials from Supabase if present
    await supabase.from('study_materials').delete().in('id', ['mat_1', 'mat_2']);

    // Seed Quiz Questions if empty so practice tests are ready
    const { data: remoteQuestions, error: qErr } = await supabase.from('quiz_questions').select('id').limit(1);
    if (!qErr && (!remoteQuestions || remoteQuestions.length === 0)) {
      for (const q of SAMPLE_QUIZ_BANK) {
        await supabase.from('quiz_questions').upsert(
          {
            id: q.id,
            subject_id: q.subjectId || null,
            topic_id: q.topicId || null,
            question_text: q.questionText,
            options: q.options,
            correct_option_index: q.correctOptionIndex,
            explanation: q.explanation || '',
            difficulty: q.difficulty || 'medium',
          },
          { onConflict: 'id' }
        );
      }
    }
  } catch (err) {
    console.warn('Notice during curriculum auto-seed to Supabase:', err);
  }
}

/**
 * 1. STUDY MATERIALS: Upsert uploaded PDF or study material into Supabase
 */
export async function syncMaterialToSupabase(mat: StudyMaterial): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    if (mat.subjectId) {
      await ensureSubjectExistsInSupabase(mat.subjectId, mat.subjectName);
    }

    const payload = {
      id: mat.id,
      subject_id: mat.subjectId || null,
      unit_number: mat.unitNumber || 1,
      topic_id: mat.topicId || null,
      title: mat.title,
      description: mat.description || '',
      file_type: mat.fileType || 'pdf',
      file_url: mat.fileUrl,
      file_size: mat.fileSize || 'PDF',
      is_published: mat.isPublished ?? true,
      uploader_name: mat.uploaderName || 'Faculty',
      created_at: mat.createdAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('study_materials').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Notice: Could not sync study material to Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Notice: Syncing material error:', err);
  }
}

/**
 * 2. STUDY MATERIALS: Delete material from Supabase
 */
export async function deleteMaterialFromSupabase(materialId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from('study_materials').delete().eq('id', materialId);
    if (error) {
      console.warn('Notice: Could not delete material from Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Notice: Delete material error:', err);
  }
}

/**
 * 3. STUDY MATERIALS: Fetch remote materials from Supabase
 */
export async function fetchMaterialsFromSupabase(): Promise<StudyMaterial[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('study_materials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return null;
    return data.map((d: any) => ({
      id: d.id,
      subjectId: d.subject_id,
      unitNumber: d.unit_number,
      topicId: d.topic_id,
      title: d.title,
      description: d.description || '',
      fileType: d.file_type || 'pdf',
      fileUrl: d.file_url,
      fileSize: d.file_size || 'PDF',
      isPublished: Boolean(d.is_published),
      uploaderName: d.uploader_name || 'Faculty',
      createdAt: d.created_at || new Date().toISOString(),
    }));
  } catch {
    return null;
  }
}

/**
 * 4. STUDY PLANS: Sync created / updated planner task to Supabase
 */
export async function syncTaskToSupabase(task: StudyPlanTask): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const authUserId = await getAuthUserId();
    const validUid = toValidUUID(authUserId);

    if (task.subjectId) {
      await ensureSubjectExistsInSupabase(task.subjectId, task.subjectName);
    }

    const payload = {
      id: task.id,
      user_id: validUid,
      subject_id: task.subjectId || null,
      subject_name: task.subjectName || null,
      title: task.title,
      priority: task.priority || 'medium',
      duration_mins: task.durationMins || 45,
      due_date: task.dueDate || new Date().toISOString().split('T')[0],
      is_completed: task.isCompleted ?? false,
      created_at: task.createdAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('study_plans').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Notice: Could not sync study plan to Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Notice: Task sync error:', err);
  }
}

/**
 * 5. STUDY PLANS: Delete planner task from Supabase
 */
export async function deleteTaskFromSupabase(taskId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('study_plans').delete().eq('id', taskId);
  } catch (err) {
    console.warn('Notice: Delete task error:', err);
  }
}

/**
 * 6. QUIZ ATTEMPTS: Sync completed test score to Supabase
 */
export async function syncQuizAttemptToSupabase(attempt: QuizAttempt): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const authUserId = await getAuthUserId();
    const validUid = toValidUUID(authUserId);

    if (attempt.subjectId) {
      await ensureSubjectExistsInSupabase(attempt.subjectId, attempt.subjectName);
    }

    const payload = {
      id: attempt.id,
      user_id: validUid,
      subject_id: attempt.subjectId,
      subject_name: attempt.subjectName,
      topic_title: attempt.topicTitle || 'Comprehensive Quiz',
      score_percentage: attempt.scorePercentage,
      total_questions: attempt.totalQuestions,
      correct_count: attempt.correctCount,
      time_taken_seconds: attempt.timeTakenSeconds,
      completed_at: attempt.completedAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('quiz_attempts').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Notice: Could not sync quiz attempt to Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Notice: Quiz attempt sync error:', err);
  }
}

/**
 * 7. WEAK TOPICS: Sync weak topic record to Supabase
 */
export async function syncWeakTopicToSupabase(topic: WeakTopic): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const authUserId = await getAuthUserId();
    const validUid = toValidUUID(authUserId);

    if (topic.subjectId) {
      await ensureSubjectExistsInSupabase(topic.subjectId, topic.subjectName);
    }

    const payload = {
      id: topic.id,
      user_id: validUid,
      subject_id: topic.subjectId,
      subject_name: topic.subjectName,
      topic_id: topic.topicId,
      topic_name: topic.topicName,
      accuracy_percentage: topic.accuracyPercentage,
      error_count: topic.errorCount || 1,
      last_attempted: topic.lastAttempted || new Date().toISOString(),
      status: topic.status || 'critical',
    };

    await supabase.from('weak_topics').upsert(payload, { onConflict: 'id' });
  } catch (err) {
    console.warn('Notice: Weak topic sync error:', err);
  }
}

/**
 * 8. AI TUTOR: Sync chat messages & conversations to Supabase
 */
export async function syncAIMessageToSupabase(
  conversationId: string,
  convTitle: string,
  message: ChatMessage
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const authUserId = await getAuthUserId();
    const validUid = toValidUUID(authUserId);

    // 1. Ensure conversation exists in Supabase
    await supabase.from('ai_conversations').upsert(
      {
        id: conversationId,
        user_id: validUid,
        title: convTitle || 'AI Study Session',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    // 2. Guarantee 100% valid ISO 8601 timestamp for PostgreSQL timestamptz
    let isoTimestamp = new Date().toISOString();
    if (message.timestamp && !isNaN(Date.parse(message.timestamp))) {
      isoTimestamp = new Date(message.timestamp).toISOString();
    }

    // 3. Upsert message into Supabase
    await supabase.from('ai_messages').upsert(
      {
        id: message.id,
        conversation_id: conversationId,
        sender: message.sender,
        content: message.content,
        learning_level: message.learningLevel || 'intermediate',
        created_at: isoTimestamp,
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Notice: AI message sync error:', err);
  }
}

/**
 * 8b. AI TUTOR: Delete conversation from Supabase
 */
export async function deleteConversationFromSupabase(conversationId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('ai_conversations').delete().eq('id', conversationId);
  } catch (err) {
    console.warn('Notice: Delete conversation error:', err);
  }
}

/**
 * 9. STUDY PLANS: Fetch remote tasks for authenticated user
 */
export async function fetchTasksFromSupabase(): Promise<StudyPlanTask[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const authUserId = await getAuthUserId();
    if (!authUserId) return null;
    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', authUserId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return null;
    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      subjectId: d.subject_id,
      subjectName: d.subject_name,
      title: d.title,
      priority: d.priority || 'medium',
      durationMins: d.duration_mins || 45,
      dueDate: d.due_date || new Date().toISOString().split('T')[0],
      isCompleted: Boolean(d.is_completed),
      createdAt: d.created_at || new Date().toISOString(),
    }));
  } catch {
    return null;
  }
}

/**
 * 10. QUIZ ATTEMPTS: Fetch remote attempts for authenticated user
 */
export async function fetchQuizAttemptsFromSupabase(): Promise<QuizAttempt[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const authUserId = await getAuthUserId();
    if (!authUserId) return null;
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', authUserId)
      .order('completed_at', { ascending: false });

    if (error || !data || data.length === 0) return null;
    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      subjectId: d.subject_id,
      subjectName: d.subject_name,
      topicTitle: d.topic_title,
      scorePercentage: d.score_percentage,
      totalQuestions: d.total_questions,
      correctCount: d.correct_count,
      timeTakenSeconds: d.time_taken_seconds,
      completedAt: d.completed_at,
    }));
  } catch {
    return null;
  }
}

/**
 * 11. WEAK TOPICS: Fetch remote weak topics for authenticated user
 */
export async function fetchWeakTopicsFromSupabase(): Promise<WeakTopic[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const authUserId = await getAuthUserId();
    if (!authUserId) return null;
    const { data, error } = await supabase
      .from('weak_topics')
      .select('*')
      .eq('user_id', authUserId);

    if (error || !data || data.length === 0) return null;
    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      subjectId: d.subject_id,
      subjectName: d.subject_name,
      topicId: d.topic_id,
      topicName: d.topic_name,
      accuracyPercentage: d.accuracy_percentage,
      errorCount: d.error_count,
      lastAttempted: d.last_attempted,
      status: d.status,
    }));
  } catch {
    return null;
  }
}

/**
 * 12. FEEDBACK: Synchronize student feedback directly into Supabase table 'feedbacks'
 */
export async function syncFeedbackToSupabase(feedback: UserFeedback): Promise<void> {
  if (!isSupabaseConfigured || !feedback.id) return;
  try {
    const authUserId = await getAuthUserId();
    const payload = {
      id: feedback.id,
      user_id: toValidUUID(authUserId),
      email: feedback.email || 'anonymous@student.com',
      rating: feedback.rating || 5,
      category: feedback.category || 'general',
      message: feedback.message || '',
      created_at: feedback.createdAt || new Date().toISOString(),
    };
    await supabase.from('feedbacks').upsert(payload, { onConflict: 'id' });
  } catch (err) {
    console.warn('Notice: Supabase feedback sync note:', err);
  }
}

/**
 * 12b. FEEDBACK: Fetch all student feedbacks from Supabase
 */
export async function fetchFeedbacksFromSupabase(): Promise<UserFeedback[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return null;
    return data.map((d: any) => ({
      id: d.id,
      rating: d.rating,
      category: d.category,
      message: d.message,
      email: d.email,
      createdAt: d.created_at,
    }));
  } catch (err) {
    console.warn('Notice: Fetch feedbacks from Supabase note:', err);
    return null;
  }
}
