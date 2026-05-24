<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE applications MODIFY COLUMN status ENUM('applied', 'under_review', 'shortlisted', 'rejected', 'approved') NOT NULL DEFAULT 'applied'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE applications MODIFY COLUMN status ENUM('applied', 'under_review', 'shortlisted', 'rejected') NOT NULL DEFAULT 'applied'");
    }
};
