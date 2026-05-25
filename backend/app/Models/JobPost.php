<?php

namespace App\Models;

use App\Traits\HasLocalizedFields;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Builder;

class JobPost extends Model
{
    use SoftDeletes;
    use HasLocalizedFields;

    protected $fillable = [
        'company_id',
        'title',
        'title_ar',
        'category',
        'category_ar',
        'description',
        'description_ar',
        'responsibilities',
        'responsibilities_ar',
        'location',
        'location_ar',
        'work_mode',
        'job_type',
        'salary_range',
        'salary_min',
        'salary_max',
        'experience_level',
        'education',
        'status',
        'views',
        'is_active',
    ];

    protected array $localizedFields = ['title', 'category', 'description', 'responsibilities', 'location'];

    protected $appends = [
        'title_localized',
        'category_localized',
        'description_localized',
        'responsibilities_localized',
        'location_localized',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'salary_min' => 'integer',
            'salary_max' => 'integer',
            'views' => 'integer',
        ];
    }

    public function companyProfile(): BelongsTo
    {
        return $this->belongsTo(CompanyProfile::class, 'company_id');
    }

    public function jobRequiredSkills(): HasMany
    {
        return $this->hasMany(JobRequiredSkill::class, 'job_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class, 'job_id');
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'job_required_skills', 'job_id', 'skill_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
