<?php

namespace App\Traits;

use Illuminate\Support\Facades\App;

/**
 * Resolves `*_localized` accessors for every column listed in $localizedFields.
 *
 * Example: on a model, declare
 *   protected array $localizedFields = ['title', 'description'];
 *   protected $appends = ['title_localized', 'description_localized'];
 *
 * The trait then resolves `$model->title_localized` to the `_ar` column when
 * the current app locale is Arabic and that column is non-empty; otherwise
 * it falls back to the base column. Including the `*_localized` keys in
 * `$appends` makes them part of the JSON serialization.
 */
trait HasLocalizedFields
{
    public function getAttribute($key)
    {
        if (is_string($key) && str_ends_with($key, '_localized')) {
            $base = substr($key, 0, -strlen('_localized'));
            if (in_array($base, $this->localizedFields ?? [], true)) {
                return $this->resolveLocalized($base);
            }
        }

        return parent::getAttribute($key);
    }

    protected function resolveLocalized(string $base): mixed
    {
        if (App::getLocale() === 'ar') {
            $arabic = $this->attributes[$base . '_ar'] ?? null;
            if (!empty($arabic)) {
                return $arabic;
            }
        }

        return $this->attributes[$base] ?? null;
    }
}
