import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';

// Select all fields because the citizen-facing schema intentionally uses the
// exact display column names "Issue Type", "Description", and "MoreDetail".
const complaintColumns = '*';
const reportImageBucket = 'report';
let pendingAnonymousSignIn;

export async function ensureCitizenSession() {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session?.user) return sessionData.session.user;

  if (!pendingAnonymousSignIn) {
    pendingAnonymousSignIn = supabase.auth
      .signInAnonymously()
      .then(({ data, error }) => {
        if (error) throw error;
        if (!data.user) throw new Error('Could not create a citizen session.');
        return data.user;
      })
      .finally(() => {
        pendingAnonymousSignIn = undefined;
      });
  }
  return pendingAnonymousSignIn;
}

export async function loadMyComplaints() {
  const { data, error } = await supabase
    .from('UserReport')
    .select(complaintColumns)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toIssue);
}

export async function createComplaint({ category, title, details, place, photo }) {
  const user = await ensureCitizenSession();
  let uploadedPhotoPath;

  if (photo) {
    if (!photo.base64) {
      throw new Error('The selected photo could not be read. Please choose it again.');
    }

    const contentType = photo.type || 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
      throw new Error('Choose a JPG, PNG, or WebP image.');
    }
    const extension = contentType.split('/')[1].replace('jpeg', 'jpg');
    const filePath = `UserReport/${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extension}`;
    const { data: uploadedPhoto, error: uploadError } = await supabase.storage
      .from(reportImageBucket)
      .upload(filePath, decode(photo.base64), {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;
    uploadedPhotoPath = uploadedPhoto.path;
  }

  try {
    const { data, error } = await supabase
      .from('UserReport')
      .insert({
        user_id: user.id,
        'Issue Type': title.trim(),
        Description: category,
        MoreDetail: details.trim() || null,
        image_urls: uploadedPhotoPath ? [uploadedPhotoPath] : [],
        latitude: null,
        longitude: null,
        location_address: place,
      })
      .select(complaintColumns)
      .single();

    if (error) throw error;
    return toIssue(data);
  } catch (error) {
    if (uploadedPhotoPath) {
      await supabase.storage.from(reportImageBucket).remove([uploadedPhotoPath]);
    }
    throw error;
  }
}

export async function saveCitizenFeedback(complaintNumber, feedback) {
  const { error } = await supabase
    .from('UserReport')
    .update({ citizen_feedback: feedback })
    .eq('complaint_number', complaintNumber);
  if (error) throw error;
}

export function subscribeToMyComplaints(userId, onChange) {
  return supabase
    .channel(`citizen-complaints-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'UserReport',
        filter: `user_id=eq.${userId}`,
      },
      payload => {
        if (payload.eventType === 'DELETE') {
          onChange({ type: 'DELETE', complaintNumber: payload.old.complaint_number });
          return;
        }
        onChange({ type: payload.eventType, issue: toIssue(payload.new) });
      },
    )
    .subscribe();
}

export function removeComplaintSubscription(channel) {
  if (channel) return supabase.removeChannel(channel);
  return Promise.resolve('ok');
}

function toIssue(row) {
  const createdAt = new Date(row.created_at);
  const now = new Date();
  const dateOptions = { hour: 'numeric', minute: '2-digit' };
  const dayLabel =
    createdAt.toDateString() === now.toDateString()
      ? 'Today'
      : createdAt.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

  return {
    id: row.complaint_number,
    databaseId: row.id,
    title: row['Issue Type'],
    category: row.Description,
    place: row.location_address,
    status: row.status,
    date: `${dayLabel}, ${createdAt.toLocaleTimeString('en-IN', dateOptions)}`,
    createdAt: row.created_at,
    details: row.MoreDetail ?? undefined,
    citizenFeedback: row.citizen_feedback,
  };
}
