# Supabase: 6-digit email verification

MamaNote uses **Supabase Auth OTP** for sign-up. After creating an account, users receive a **6-digit code** by email and enter it on the verify screen.

## Dashboard configuration (required)

1. Open your project → **Authentication** → **Providers** → **Email**.
2. Enable **Confirm email**.
3. Under **Email OTP**, ensure OTP is enabled (6-digit codes, not only magic links).

4. **Authentication** → **Email Templates** → **Confirm signup**  
   Paste the colorful template below. Use `{{ .Token }}` for the 6-digit OTP (not only `{{ .ConfirmationURL }}`).

   **Subject:** `Welcome to MamaNote — your verification code`

   **Body:**

   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <meta charset="utf-8" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
   </head>
   <body style="margin:0;padding:0;background-color:#FFF5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FFF5F7;padding:32px 16px;">
       <tr>
         <td align="center">
           <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(251,113,133,0.15);">
             <!-- Header -->
             <tr>
               <td style="background:linear-gradient(135deg,#FB7185 0%,#F472B6 50%,#C084FC 100%);padding:32px 24px;text-align:center;">
                 <p style="margin:0 0 8px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.85);">Welcome to</p>
                 <h1 style="margin:0;font-size:28px;font-weight:700;color:#FFFFFF;">MamaNote 💕</h1>
                 <p style="margin:12px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">Gentle tracking for your little one</p>
               </td>
             </tr>
             <!-- Body -->
             <tr>
               <td style="padding:32px 28px;">
                 <p style="margin:0 0 8px;font-size:16px;color:#3D3550;">Hi there,</p>
                 <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#6B6280;">
                   Thanks for joining MamaNote! Enter this 6-digit code in the app to verify <strong style="color:#3D3550;">{{ .Email }}</strong>:
                 </p>
                 <!-- OTP box -->
                 <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                   <tr>
                     <td align="center" style="background:linear-gradient(135deg,#FFF0F3 0%,#F3E8FF 100%);border-radius:16px;padding:24px;border:2px solid #FBCFE8;">
                       <p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#A89FBE;">Your verification code</p>
                       <p style="margin:0;font-size:36px;font-weight:700;letter-spacing:8px;color:#FB7185;">{{ .Token }}</p>
                     </td>
                   </tr>
                 </table>
                 <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#A89FBE;text-align:center;">
                   This code expires in 1 hour.<br />
                   If you didn't create a MamaNote account, you can ignore this email.
                 </p>
               </td>
             </tr>
             <!-- Footer -->
             <tr>
               <td style="background:#FAF5FF;padding:20px 28px;text-align:center;border-top:1px solid #F3E8FF;">
                 <p style="margin:0;font-size:13px;color:#C084FC;">Made with love for parents everywhere 🍼</p>
               </td>
             </tr>
           </table>
         </td>
       </tr>
     </table>
   </body>
   </html>
   ```

5. **Authentication** → **Email Templates** → **Reset password**  
   Use the same OTP flow for password recovery.

   **Subject:** `Reset your MamaNote password`

   **Body:**

   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <meta charset="utf-8" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
   </head>
   <body style="margin:0;padding:0;background-color:#FFF5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FFF5F7;padding:32px 16px;">
       <tr>
         <td align="center">
           <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(251,113,133,0.15);">
             <!-- Header -->
             <tr>
               <td style="background:linear-gradient(135deg,#F59E0B 0%,#FB7185 50%,#EC4899 100%);padding:32px 24px;text-align:center;">
                 <p style="margin:0 0 8px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.85);">Password reset</p>
                 <h1 style="margin:0;font-size:28px;font-weight:700;color:#FFFFFF;">MamaNote 🔐</h1>
                 <p style="margin:12px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">Let's get you back in</p>
               </td>
             </tr>
             <!-- Body -->
             <tr>
               <td style="padding:32px 28px;">
                 <p style="margin:0 0 8px;font-size:16px;color:#3D3550;">Hi,</p>
                 <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#6B6280;">
                   We received a request to reset the password for <strong style="color:#3D3550;">{{ .Email }}</strong>. Enter this code in the app:
                 </p>
                 <!-- OTP box -->
                 <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                   <tr>
                     <td align="center" style="background:linear-gradient(135deg,#FFF7ED 0%,#FFF0F3 100%);border-radius:16px;padding:24px;border:2px solid #FED7AA;">
                       <p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#A89FBE;">Your reset code</p>
                       <p style="margin:0;font-size:36px;font-weight:700;letter-spacing:8px;color:#FB7185;">{{ .Token }}</p>
                     </td>
                   </tr>
                 </table>
                 <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#A89FBE;text-align:center;">
                   This code expires in 1 hour.<br />
                   If you didn't request this, you can safely ignore this email.
                 </p>
               </td>
             </tr>
             <!-- Footer -->
             <tr>
               <td style="background:#FFF7ED;padding:20px 28px;text-align:center;border-top:1px solid #FFEDD5;">
                 <p style="margin:0;font-size:13px;color:#F59E0B;">Your account stays safe with us 💛</p>
               </td>
             </tr>
           </table>
         </td>
       </tr>
     </table>
   </body>
   </html>
   ```

6. Optional: **Authentication** → **Settings** → set OTP expiry (default 3600 seconds).

## App flow

1. **Sign up** → `signUpWithEmail()` → Supabase sends OTP → navigate to `/(auth)/verify-email`.
2. **Verify** → user enters 6 digits → `verifySignupOtp()` → session created → home tabs.
3. **Resend** → `resendSignupOtp()` (60s cooldown in UI).
4. **Sign in** without verifying → redirected to verify screen.

## API functions (`src/lib/auth.ts`)

| Function | Purpose |
| -------- | ------- |
| `signUpWithEmail` | Register; signs out if session exists but email unconfirmed |
| `verifySignupOtp` | `verifyOtp({ type: 'signup', email, token })` |
| `resendSignupOtp` | `resend({ type: 'signup', email })` |
| `resetPassword` | Sends recovery OTP to email |
| `verifyRecoveryOtp` | `verifyOtp({ type: 'recovery', email, token })` |
| `updatePassword` | Sets new password after recovery OTP verified |

## Local testing

With Supabase local dev, check **Authentication** → **Users** or Inbucket for the OTP email.
