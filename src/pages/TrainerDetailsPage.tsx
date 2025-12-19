import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Award, Edit2, Trash2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuthStore } from '@/store/authStore';
import { trainersService, Trainer } from '@/services/trainers.service';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

export default function TrainerDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    yearsOfExperience: '',
    hourlyRate: '',
  });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { success, error: showError } = useToast();

  const tenantId = user?.tenantId;
  const trainerId = id;

  const fetchData = useCallback(async () => {
    if (!tenantId || !trainerId) return;

    try {
      setLoading(true);
      setError(null);

      const trainerData = await trainersService.getById(tenantId, trainerId);
      setTrainer(trainerData);
      setEditForm({
        bio: trainerData.bio || '',
        yearsOfExperience: String(trainerData.yearsOfExperience),
        hourlyRate: String(trainerData.hourlyRate || ''),
      });
    } catch (e: any) {
      console.error('Error loading trainer details:', e);
      setError(e?.response?.data?.message || 'Failed to load trainer details');
      setTrainer(null);
    } finally {
      setLoading(false);
    }
  }, [tenantId, trainerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async () => {
    if (!tenantId || !trainerId) return;

    try {
      setUpdating(true);
      await trainersService.update(tenantId, trainerId, {
        bio: editForm.bio,
        yearsOfExperience: parseInt(editForm.yearsOfExperience),
        hourlyRate: editForm.hourlyRate ? parseFloat(editForm.hourlyRate) : undefined,
      });
      success('Success', 'Trainer updated successfully');
      setIsEditOpen(false);
      fetchData();
    } catch (e: any) {
      console.error('Error updating trainer:', e);
      showError('Error', e?.response?.data?.message || 'Failed to update trainer');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!tenantId || !trainerId) return;
    if (!confirm('Are you sure you want to delete this trainer?')) return;

    try {
      setDeleting(true);
      await trainersService.delete(tenantId, trainerId);
      success('Success', 'Trainer deleted successfully');
      navigate('/trainers');
    } catch (e: any) {
      console.error('Error deleting trainer:', e);
      showError('Error', e?.response?.data?.message || 'Failed to delete trainer');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-gray-600">Loading trainer...</p>
      </div>
    );
  }

  if (!trainerId || !tenantId) {
    return (
      <Card>
        <CardContent className="py-6">
          <EmptyState
            icon={Award}
            title="Trainer not found"
            description="Missing tenant or trainer id."
            actionLabel="Back to Trainers"
            onAction={() => navigate('/trainers')}
            actionIcon={ArrowLeft}
          />
        </CardContent>
      </Card>
    );
  }

  if (error || !trainer) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/trainers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={Award}
              title="Failed to load trainer"
              description={error || 'Something went wrong.'}
              actionLabel="Retry"
              onAction={fetchData}
              actionIcon={Award}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/trainers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {trainer.user ? `${trainer.user.firstName} ${trainer.user.lastName}` : 'Trainer'}
            </h1>
            <p className="text-gray-600 mt-1">Trainer details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{trainer.availabilityStatus}</Badge>
          <Badge variant="outline">{trainer.experienceLevel}</Badge>
          <Button size="sm" onClick={() => setIsEditOpen(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div className="text-2xl font-bold text-gray-900">{trainer.rating.toFixed(1)}</div>
            </div>
            <p className="text-sm text-gray-600">Rating ({trainer.totalReviews} reviews)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{trainer.yearsOfExperience}</div>
            <p className="text-sm text-gray-600">Years Experience</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{trainer.totalSessionsConducted}</div>
            <p className="text-sm text-gray-600">Sessions Conducted</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trainer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{trainer.user?.email || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium text-gray-900">{trainer.user?.phone || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Experience Level</p>
              <Badge variant="outline" className="capitalize">{trainer.experienceLevel}</Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Availability</p>
              <Badge variant="outline" className="capitalize">{trainer.availabilityStatus}</Badge>
            </div>

            {trainer.hourlyRate && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Hourly Rate</p>
                <p className="font-medium text-gray-900">₹{trainer.hourlyRate}</p>
              </div>
            )}

            {trainer.offersDemoSession && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Demo Session</p>
                <Badge variant="success">Available ({trainer.demoSessionDurationMinutes}min)</Badge>
              </div>
            )}
          </div>

          {trainer.bio && (
            <div className="mt-6">
              <p className="text-sm text-gray-600">Bio</p>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{trainer.bio}</p>
            </div>
          )}

          {trainer.specializations && trainer.specializations.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-2">Specializations</p>
              <div className="flex flex-wrap gap-2">
                {trainer.specializations.map((spec, idx) => (
                  <Badge key={idx} variant="outline" className="capitalize">
                    {spec.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {trainer.certifications && trainer.certifications.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-2">Certifications</p>
              <div className="flex flex-col gap-2">
                {trainer.certifications.map((cert, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-900">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Trainer</SheetTitle>
            <SheetDescription>Update trainer information</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
              <Input
                id="yearsOfExperience"
                type="number"
                value={editForm.yearsOfExperience}
                onChange={(e) => setEditForm({ ...editForm, yearsOfExperience: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={editForm.hourlyRate}
                onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdate} disabled={updating} className="flex-1">
                {updating ? 'Updating...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
