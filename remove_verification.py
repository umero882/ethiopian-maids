import re

# Read the file
with open('src/components/profile/completion/AgencyFormPage1.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the verification sections for contact phone - lines 327-371
# Pattern: from "!formData.contactPhoneVerified" to the closing div before next section
content = re.sub(
    r'\{!formData\.contactPhoneVerified && !verificationState\?\. contactPhone\?\.sent && formData\.contactPhone && \(.*?\)\}\s*\{formData\.contactPhoneVerified && \(.*?\)\}\s*\</div>\s*\{verificationState\?\.contactPhone\?\.sent && !formData\.contactPhoneVerified && \(.*?\)\}',
    '',
    content,
    flags=re.DOTALL
)

# Similar for email verification
content = re.sub(
    r'\{!formData\.officialEmailVerified && !verificationState\?\.officialEmail\?\.sent && formData\.officialEmail && \(.*?\)\}\s*\{formData\.officialEmailVerified && \(.*?\)\}\s*\</div>\s*\{verificationState\?\.officialEmail\?\.sent && !formData\.officialEmailVerified && \(.*?\)\}',
    '',
    content,
    flags=re.DOTALL
)

# Write back
with open('src/components/profile/completion/AgencyFormPage1.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Verification sections removed")
