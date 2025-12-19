import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Mail, Phone, Star, Award, Calendar, Search, Filter, X, Check, UserCheck } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuthStore } from '@/store/authStore';
import { 
  trainersService, 
  Trainer, 
  TrainerSpecialization,
  TrainerExperienceLevel,
  TrainerAvailabilityStatus,
  TrainerFilters 
} from '@/services/trainers.service';

// Human readable labels for specializations
const SPECIALIZATION_LABELS: Record<TrainerSpecialization, string> = {
  [TrainerSpecialization.STRENGTH_TRAINING]: 'Strength Training',
  [TrainerSpecialization.CARDIO]: 'Cardio',
  [TrainerSpecialization.YOGA]: 'Yoga',
  [TrainerSpecialization.PILATES]: 'Pilates',
  [TrainerSpecialization.CROSSFIT]: 'CrossFit',
  [TrainerSpecialization.BODYBUILDING]: 'Bodybuilding',
  [TrainerSpecialization.WEIGHT_LOSS]: 'Weight Loss',
  [TrainerSpecialization.NUTRITION]: 'Nutrition',
  [TrainerSpecialization.SPORTS_SPECIFIC]: 'Sports Specific',
  [TrainerSpecialization.REHABILITATION]: 'Rehabilitation',
  [TrainerSpecialization.FUNCTIONAL_TRAINING]: 'Functional Training',
  [TrainerSpecialization.HIIT]: 'HIIT',
  [TrainerSpecialization.MARTIAL_ARTS]: 'Martial Arts',
  [TrainerSpecialization.DANCE_FITNESS]: 'Dance Fitness',
  [TrainerSpecialization.SENIOR_FITNESS]: 'Senior Fitness',
  [TrainerSpecialization.PRENATAL_POSTNATAL]: 'Prenatal/Postnatal',
};
import Pagination from '@/components/ui/pagination';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import AddTrainerForm from '@/components/forms/AddTrainerForm';

// Human readable labels for experience levels
const EXPERIENCE_LABELS: Record<TrainerExperienceLevel, string> = {
  [TrainerExperienceLevel.BEGINNER]: 'Beginner (0-2 yrs)',
  [TrainerExperienceLevel.INTERMEDIATE]: 'Intermediate (2-5 yrs)',
  [TrainerExperienceLevel.ADVANCED]: 'Advanced (5-10 yrs)',
  [TrainerExperienceLevel.EXPERT]: 'Expert (10+ yrs)',
};

// Human readable labels for availability status
const AVAILABILITY_LABELS: Record<TrainerAvailabilityStatus, string> = {
  [TrainerAvailabilityStatus.AVAILABLE]: 'Available',
  [TrainerAvailabilityStatus.BUSY]: 'Busy',
  [TrainerAvailabilityStatus.ON_LEAVE]: 'On Leave',
  [TrainerAvailabilityStatus.INACTIVE]: 'Inactive',
};

export default function TrainersPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddTrainerOpen, setIsAddTrainerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTrainers, setTotalTrainers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecializations, setSelectedSpecializations] = useState<TrainerSpecialization[]>([]);
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState<TrainerExperienceLevel | ''>('');
  const [selectedAvailabilityStatus, setSelectedAvailabilityStatus] = useState<TrainerAvailabilityStatus | ''>('');
  const [offersDemoSession, setOffersDemoSession] = useState<boolean | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedSpecializations, selectedExperienceLevel, selectedAvailabilityStatus, offersDemoSession, minRating]);

  useEffect(() => {
    if (user?.tenantId) {
      fetchTrainers();
    }
  }, [user?.tenantId, currentPage, debouncedSearch, selectedSpecializations, selectedExperienceLevel, selectedAvailabilityStatus, offersDemoSession, minRating]);

  const fetchTrainers = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      setError(null);

      // Build filters object
      const filters: TrainerFilters = {
        page: currentPage,
        limit: limit,
      };

      if (debouncedSearch) {
        filters.search = debouncedSearch;
      }
      if (selectedSpecializations.length > 0) {
        filters.specializations = selectedSpecializations;
      }
      if (selectedExperienceLevel) {
        filters.experienceLevel = selectedExperienceLevel;
      }
      if (selectedAvailabilityStatus) {
        filters.availabilityStatus = selectedAvailabilityStatus;
      }
      if (offersDemoSession !== undefined) {
        filters.offersDemoSession = offersDemoSession;
      }
      if (minRating !== undefined) {
        filters.minRating = minRating;
      }

      const response = await trainersService.getAll(user.tenantId, filters);
      
      // Handle both old format (data/meta) and new format (trainers/total)
      const data = response.trainers || response.data || [];
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setTrainers(data);
        setTotalTrainers(response.total);
        setTotalPages(Math.ceil(response.total / limit));
        console.log('✅ Trainers loaded:', data.length, 'trainers');
      } else {
        console.error('❌ Invalid trainers data:', data);
        setTrainers([]);
        setError('Invalid data format received');
      }
    } catch (error: any) {
      console.error('❌ Error fetching trainers:', error?.message || error);
      setError('Failed to load trainers. Using sample data.');
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, currentPage, debouncedSearch, selectedSpecializations, selectedExperienceLevel, selectedAvailabilityStatus, offersDemoSession, minRating]);

  const toggleSpecialization = (spec: TrainerSpecialization) => {
    setSelectedSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSpecializations([]);
    setSelectedExperienceLevel('');
    setSelectedAvailabilityStatus('');
    setOffersDemoSession(undefined);
    setMinRating(undefined);
  };

  const hasActiveFilters = searchQuery || selectedSpecializations.length > 0 || selectedExperienceLevel || selectedAvailabilityStatus || offersDemoSession !== undefined || minRating !== undefined;

  const handleAddTrainerSuccess = () => {
    setIsAddTrainerOpen(false);
    fetchTrainers();
  };

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

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4">
            {/* Search and Toggle Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Toggle Filters Button */}
              <Button
                variant={showFilters ? 'default' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {[
                      selectedSpecializations.length > 0,
                      !!selectedExperienceLevel,
                      !!selectedAvailabilityStatus,
                      offersDemoSession !== undefined,
                      minRating !== undefined,
                    ].filter(Boolean).length}
                  </Badge>
                )}
              </Button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearAllFilters} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                {/* Experience Level Filter */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Experience Level</Label>
                  <select
                    value={selectedExperienceLevel}
                    onChange={(e) => setSelectedExperienceLevel(e.target.value as TrainerExperienceLevel | '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">All Levels</option>
                    {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Availability Status Filter */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Availability</Label>
                  <select
                    value={selectedAvailabilityStatus}
                    onChange={(e) => setSelectedAvailabilityStatus(e.target.value as TrainerAvailabilityStatus | '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">All Status</option>
                    {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Demo Session Filter */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Demo Sessions</Label>
                  <select
                    value={offersDemoSession === undefined ? '' : offersDemoSession ? 'true' : 'false'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOffersDemoSession(val === '' ? undefined : val === 'true');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">All</option>
                    <option value="true">Offers Demo</option>
                    <option value="false">No Demo</option>
                  </select>
                </div>

                {/* Min Rating Filter */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Minimum Rating</Label>
                  <select
                    value={minRating ?? ''}
                    onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                  </select>
                </div>

                {/* Specializations Filter - Full Width */}
                <div className="md:col-span-2 lg:col-span-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Specializations</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(TrainerSpecialization).map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialization(spec)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          selectedSpecializations.includes(spec)
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {selectedSpecializations.includes(spec) && <Check className="h-3 w-3" />}
                        {SPECIALIZATION_LABELS[spec]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-700">{totalTrainers}</div>
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
      {!loading && trainers.length === 0 && (
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={UserCheck}
              title={hasActiveFilters ? "No trainers match your filters" : "No trainers yet"}
              description={hasActiveFilters 
                ? "Try adjusting your filters or search query to find trainers."
                : "Add your first trainer to start managing your training staff."
              }
              actionLabel={hasActiveFilters ? "Clear Filters" : "Add Trainer"}
              onAction={hasActiveFilters ? clearAllFilters : () => setIsAddTrainerOpen(true)}
              actionIcon={hasActiveFilters ? X : Plus}
            />
          </CardContent>
        </Card>
      )}

      {/* Trainers Grid */}
      {!loading && trainers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((trainer: Trainer) => (
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
                          {trainer.rating ? Number(trainer.rating).toFixed(1) : '0.0'}
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
                        {SPECIALIZATION_LABELS[spec as TrainerSpecialization] || spec}
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/trainers/${trainer.id}`)}
                  >
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

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalTrainers}
        itemsPerPage={limit}
        onPageChange={setCurrentPage}
        loading={loading}
      />

    </div>
  );
}
