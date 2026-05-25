<?php

namespace App\Models;

use App\Traits\HasLocalizedFields;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompanyProfile extends Model
{
    use HasLocalizedFields;

    protected $fillable = [
        'user_id',
        'company_name',
        'company_name_ar',
        'description',
        'description_ar',
        'logo_url',
        'website',
        'location',
        'location_ar',
        'phone',
        'founded_year',
        'company_size',
        'industry',
        'industry_ar',
    ];

    protected array $localizedFields = ['company_name', 'description', 'location', 'industry'];

    protected $appends = [
        'company_name_localized',
        'description_localized',
        'location_localized',
        'industry_localized',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function jobPosts(): HasMany
    {
        return $this->hasMany(JobPost::class, 'company_id');
    }
}
