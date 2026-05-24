<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ApplicationApproved extends Notification
{
    public $application;

    public function __construct($application)
    {
        $this->application = $application;
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'application_id' => $this->application->id,
            'job_title' => $this->application->jobPost->title,
            'message' => 'Your application has been approved.'
        ];
    }
}
