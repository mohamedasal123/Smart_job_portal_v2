<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_posts', function (Blueprint $table) {
            $table->string('title_ar')->nullable()->after('title');
            $table->string('category_ar')->nullable()->after('category');
            $table->text('description_ar')->nullable()->after('description');
            $table->text('responsibilities_ar')->nullable()->after('responsibilities');
            $table->string('location_ar')->nullable()->after('location');
        });

        Schema::table('company_profiles', function (Blueprint $table) {
            $table->string('company_name_ar')->nullable()->after('company_name');
            $table->text('description_ar')->nullable()->after('description');
            $table->string('location_ar')->nullable()->after('location');
            $table->string('industry_ar')->nullable()->after('industry');
        });

        Schema::table('skills', function (Blueprint $table) {
            $table->string('name_ar')->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('job_posts', function (Blueprint $table) {
            $table->dropColumn(['title_ar', 'category_ar', 'description_ar', 'responsibilities_ar', 'location_ar']);
        });

        Schema::table('company_profiles', function (Blueprint $table) {
            $table->dropColumn(['company_name_ar', 'description_ar', 'location_ar', 'industry_ar']);
        });

        Schema::table('skills', function (Blueprint $table) {
            $table->dropColumn('name_ar');
        });
    }
};
