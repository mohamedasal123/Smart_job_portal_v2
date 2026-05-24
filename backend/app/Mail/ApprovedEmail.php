<?php

namespace App\Mail;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApprovedEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Application $application
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Application Approved: ' . $this->application->jobPost->title,
        );
    }

    public function content(): Content
    {
        $html = "<p>Dear " . $this->application->jobSeekerProfile->user->name . ",</p>";
        $html .= "<p>Congratulations! Your application for the " . $this->application->jobPost->title . " position at " . $this->application->jobPost->companyProfile->company_name . " has been approved.</p>";
        $html .= "<p>We will be in touch shortly with the next steps or details about your interview.</p>";
        $html .= "<p>Best regards,</p>";
        $html .= "<p>" . $this->application->jobPost->companyProfile->company_name . " Team</p>";

        return new Content(
            htmlString: $html,
        );
    }
}
