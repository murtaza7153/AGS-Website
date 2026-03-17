<?php
declare(strict_types=1);

// Hostinger-friendly contact form handler using PHP's built-in mail().
// Expects POST fields: name, email, message

// --- CONFIG ---
$RECIPIENTS = 'murtaza@avgolf.in, av@avgolf.in';
$SUBJECT_PREFIX = '[AGS Website] Contact form: ';

// Use a domain email you control (recommended for deliverability).
// If you don't have one, set it to something like: no-reply@yourdomain.com
$FROM_EMAIL = 'no-reply@avgolf.in';
$FROM_NAME  = 'AGS Website';

// Optional: where to send the user after success/failure (leave null to show text response)
$REDIRECT_SUCCESS = null; // e.g. '/thank-you.html'
$REDIRECT_ERROR   = null; // e.g. '/contact.html?error=1'

// Basic anti-spam (optional): add a hidden input named "website" to your form.
$HONEYPOT_FIELD = 'website';

// --- HELPERS ---
function respond(int $statusCode, string $message, ?string $redirectUrl = null): void {
  http_response_code($statusCode);
  if ($redirectUrl) {
    header('Location: ' . $redirectUrl, true, 302);
    exit;
  }
  header('Content-Type: text/plain; charset=UTF-8');
  echo $message;
  exit;
}

function clean_header_value(string $value): string {
  // Prevent header injection by stripping CR/LF and trimming.
  $value = str_replace(["\r", "\n"], ' ', $value);
  return trim(preg_replace('/\s+/', ' ', $value) ?? '');
}

// --- METHOD CHECK ---
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  respond(405, 'Method Not Allowed');
}

// --- INPUT ---
$name = (string)($_POST['name'] ?? '');
$email = (string)($_POST['email'] ?? '');
$message = (string)($_POST['message'] ?? '');
$honeypot = (string)($_POST[$HONEYPOT_FIELD] ?? '');

// --- HONEYPOT ---
if ($honeypot !== '') {
  // Pretend success to bots.
  respond(200, 'OK', $REDIRECT_SUCCESS);
}

// --- VALIDATION ---
$name = trim($name);
$email = trim($email);
$message = trim($message);

if ($name === '' || $email === '' || $message === '') {
  respond(400, 'Please fill in name, email, and message.', $REDIRECT_ERROR);
}

if (mb_strlen($name) > 100) {
  respond(400, 'Name is too long.', $REDIRECT_ERROR);
}

if (mb_strlen($email) > 200) {
  respond(400, 'Email is too long.', $REDIRECT_ERROR);
}

if (mb_strlen($message) > 10000) {
  respond(400, 'Message is too long.', $REDIRECT_ERROR);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  respond(400, 'Please enter a valid email address.', $REDIRECT_ERROR);
}

// --- BUILD EMAIL ---
$safeName = clean_header_value($name);
$safeEmail = clean_header_value($email);

$subject = $SUBJECT_PREFIX . $safeName;
$subject = mb_substr($subject, 0, 200);

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ua = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
$when = gmdate('Y-m-d H:i:s') . ' UTC';

$bodyLines = [
  "New contact form submission:",
  "",
  "Name: {$name}",
  "Email: {$email}",
  "",
  "Message:",
  $message,
  "",
  "---",
  "Sent: {$when}",
  "IP: {$ip}",
  "User-Agent: {$ua}",
];
$body = implode("\n", $bodyLines);

// Headers: use a fixed From for deliverability; put user email in Reply-To.
$fromName = clean_header_value($FROM_NAME);
$fromEmail = clean_header_value($FROM_EMAIL);

if (!filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
  respond(500, 'Server email configuration error.', $REDIRECT_ERROR);
}

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: ' . $fromName . ' <' . $fromEmail . '>';
$headers[] = 'Reply-To: ' . $safeName . ' <' . $safeEmail . '>';
$headers[] = 'X-Mailer: PHP/' . phpversion();

// PHP mail() needs CRLF in headers.
$headersString = implode("\r\n", $headers);

// --- SEND ---
$ok = @mail($RECIPIENTS, $subject, $body, $headersString);
if (!$ok) {
  respond(500, 'Sorry—your message could not be sent right now.', $REDIRECT_ERROR);
}

respond(200, 'Thank you! Your message has been sent.', $REDIRECT_SUCCESS);

