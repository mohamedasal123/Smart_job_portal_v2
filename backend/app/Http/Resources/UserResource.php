<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $profile = null;
        $avatarUrl = null;

        if ($this->relationLoaded('jobSeekerProfile') && $this->jobSeekerProfile) {
            $profile = $this->jobSeekerProfile;
            $contact = $profile->contact_information;
            $contact = is_array($contact) ? $contact : (json_decode($contact, true) ?? []);
            $avatarUrl = $contact['avatar'] ?? null;
        } elseif ($this->relationLoaded('companyProfile') && $this->companyProfile) {
            $profile = $this->companyProfile;
            $avatarUrl = $profile->logo_url ?? null;
        }

        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'email'         => $this->email,
            'role'          => $this->role,
            'verified'      => !is_null($this->email_verified_at),
            'banned'        => (bool) $this->is_banned,
            'created_at'    => $this->created_at,
            'profile_image' => $avatarUrl,
            'avatar'        => $avatarUrl,
            'profile'       => $profile,
        ];
    }
}
