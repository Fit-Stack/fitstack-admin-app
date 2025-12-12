import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, Phone, Star, Award, Calendar } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { trainersService, Trainer } from '@/services/trainers.service';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import AddTrainerForm from '@/components/forms/AddTrainerForm';

export default function TrainersPage() {
  const { user } = useAuthStore();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddTrainerOpen, setIsAddTrainerOpen] = useState(false);

  useEffect(() => {
    if (user?.tenantId) {
      fetchTrainers();
    }
  }, [user?.tenantId]);

  const fetchTrainers = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      setError(null);
      const { trainers: data } = await trainersService.getAll(user.tenantId, {
        limit: 50,
      });
      setTrainers(data || []);
    } catch (error) {
      console.error('Error fetching trainers:', error);
      setError('Failed to load trainers. Using sample data.');
      // Don't set trainers to empty, let it fall back to mock data
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrainerSuccess = () => {
    setIsAddTrainerOpen(false);
    fetchTrainers();
  };

  // Mock data as fallback - matches Trainer interface
  const mockTrainers: Trainer[] = [
    {
      id: '1',
      userId: 'user-1',
      user: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@fitstack.com',
        phone: '+1 (555) 123-4567',
      },
      bio: 'Certified personal trainer with 10+ years of experience',
      specializations: ['HIIT', 'Strength Training', 'CrossFit'],
      experienceLevel: 'expert',
      yearsOfExperience: 10,
      certifications: ['ACE-CPT', 'NASM-PES'],
      rating: 4.8,
      totalReviews: 156,
      totalSessionsConducted: 245,
      availabilityStatus: 'available',
      offersDemoSession: true,
      demoSessionDurationMinutes: 30,
      hourlyRate: 5000,
      weeklyAvailability: {
        monday: ['09:00-12:00', '14:00-18:00'],
        wednesday: ['09:00-12:00', '14:00-18:00'],
        friday: ['09:00-12:00', '14:00-18:00'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      userId: 'user-2',
      user: {
        id: 'user-2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@fitstack.com',
        phone: '+1 (555) 234-5678',
      },
      bio: 'Yoga instructor specializing in mindfulness and flexibility',
      specializations: ['Yoga', 'Pilates', 'Meditation'],
      experienceLevel: 'advanced',
      yearsOfExperience: 8,
      certifications: ['RYT-500', 'Pilates Certified'],
      rating: 4.9,
      totalReviews: 203,
      totalSessionsConducted: 312,
      availabilityStatus: 'available',
      offersDemoSession: true,
      demoSessionDurationMinutes: 45,
      hourlyRate: 4500,
      weeklyAvailability: {
        tuesday: ['07:00-11:00', '17:00-20:00'],
        thursday: ['07:00-11:00', '17:00-20:00'],
        saturday: ['08:00-12:00'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      userId: 'user-3',
      user: {
        id: 'user-3',
        firstName: 'Mike',
        lastName: 'Davis',
        email: 'mike.davis@fitstack.com',
        phone: '+1 (555) 345-6789',
      },
      bio: 'Professional cycling coach and endurance specialist',
      specializations: ['Cycling', 'Cardio', 'Endurance'],
      experienceLevel: 'advanced',
      yearsOfExperience: 6,
      certifications: ['USA Cycling Level 2'],
      rating: 4.7,
      totalReviews: 128,
      totalSessionsConducted: 198,
      availabilityStatus: 'busy',
      offersDemoSession: false,
      hourlyRate: 4000,
      weeklyAvailability: {
        monday: ['18:00-21:00'],
        wednesday: ['18:00-21:00'],
        friday: ['18:00-21:00'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const displayTrainers = trainers.length > 0 ? trainers : (loading ? [] : mockTrainers);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trainers</h1>
          <p className="text-gray-600 mt-1">Manage your training staff</p>
        </div>
        <Button onClick={() => setIsAddTrainerOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Trainer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-700">{trainers.length}</div>
            <p className="text-sm text-gray-500">Total Trainers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">
              {trainers.filter(t => t.availabilityStatus === 'available').length}
            </div>
            <p className="text-sm text-gray-500">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-sky-600">
              {trainers.filter(t => t.offersDemoSession).length}
            </div>
            <p className="text-sm text-gray-500">Offer Demo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-violet-600">
              {trainers.filter(t => t.experienceLevel === 'expert').length}
            </div>
            <p className="text-sm text-gray-500">Expert Level</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading trainers...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <p className="text-orange-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && displayTrainers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No trainers found. Add your first trainer to get started!</p>
            <Button className="mt-4" onClick={() => setIsAddTrainerOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Trainer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Trainers Grid */}
      {!loading && displayTrainers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTrainers.map((trainer) => (
            <Card key={trainer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {trainer.user?.avatarUrl ? (
                      <img
                        src={trainer.user.avatarUrl}
                        alt={`${trainer.user.firstName} ${trainer.user.lastName}`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-lg">
                        {trainer.user?.firstName?.[0] || 'T'}{trainer.user?.lastName?.[0] || 'R'}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {trainer.user?.firstName || 'Unknown'} {trainer.user?.lastName || 'Trainer'}
                      </CardTitle>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {trainer.rating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({trainer.totalReviews || 0} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      trainer.availabilityStatus === 'available'
                        ? 'success'
                        : trainer.availabilityStatus === 'busy'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {trainer.availabilityStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">{trainer.bio}</p>

                {/* Experience & Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {trainer.yearsOfExperience} yrs exp
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {trainer.totalSessionsConducted || 0} sessions
                    </span>
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <Badge
                    variant="outline"
                    className={
                      trainer.experienceLevel === 'expert'
                        ? 'border-purple-500 text-purple-700'
                        : trainer.experienceLevel === 'advanced'
                        ? 'border-blue-500 text-blue-700'
                        : 'border-green-500 text-green-700'
                    }
                  >
                    {trainer.experienceLevel}
                  </Badge>
                  {trainer.offersDemoSession && (
                    <Badge variant="outline" className="ml-2 border-orange-500 text-orange-700">
                      Demo Available
                    </Badge>
                  )}
                </div>

                {/* Specializations */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Specializations</p>
                  <div className="flex flex-wrap gap-1">
                    {trainer.specializations.slice(0, 3).map((spec) => (
                      <Badge key={spec} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                    {trainer.specializations.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{trainer.specializations.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                {trainer.user && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{trainer.user.email}</span>
                    </div>
                    {trainer.user.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{trainer.user.phone}</span>
                      </div>
                    )}
                    {trainer.hourlyRate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Hourly Rate:</span>
                        <span className="font-medium">₹{trainer.hourlyRate}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Trainer Side Panel */}
      <Sheet open={isAddTrainerOpen} onOpenChange={setIsAddTrainerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add New Trainer</SheetTitle>
            <SheetDescription>
              Fill in the trainer's details and availability schedule
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <AddTrainerForm
              onSuccess={handleAddTrainerSuccess}
              onCancel={() => setIsAddTrainerOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
