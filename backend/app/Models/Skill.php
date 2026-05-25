<?php

namespace App\Models;

use App\Traits\HasLocalizedFields;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Skill extends Model
{
    use HasLocalizedFields;

    protected $fillable = [
        'name',
        'name_ar',
        'type',
    ];

    protected array $localizedFields = ['name'];

    protected $appends = ['name_localized'];

    public function jobSeekerSkills(): HasMany
    {
        return $this->hasMany(JobSeekerSkill::class);
    }

    public function jobRequiredSkills(): HasMany
    {
        return $this->hasMany(JobRequiredSkill::class);
    }
}
