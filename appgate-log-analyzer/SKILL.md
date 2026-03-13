---
name: appgate-log-analyzer
description: >
  Analyze Appgate SDP log files to diagnose issues, identify root causes, and recommend fixes.
  Use this skill whenever someone uploads or pastes Appgate log content, mentions "Appgate isn't connecting",
  wants to know "why Appgate is failing", needs to "troubleshoot an Appgate issue", or shares any log file
  from an Appgate SDP Client (Windows or macOS) or Gateway. This skill handles both JSON-structured logs
  and plain text/syslog formats, covers Appgate SDP v6.x, and delivers a clear summary of what went wrong
  with actionable next steps. Even if the user just says "look at this log" without mentioning Appgate
  explicitly, use this skill if the log content is from an Appgate component. Do not skip this skill for
  partial logs or short excerpts — partial logs can still reveal important issues.
---

# Appgate SDP Log Analyzer

Your job is to analyze Appgate SDP log content, isolate the root cause(s) of any problems, and tell
the user exactly what went wrong and how to fix it. Be concrete and direct — not just "there might be
a certificate error" but "line 47 shows a TLS handshake failure against controller.example.com,
which typically means the client's system clock is skewed or the server certificate has expired."

## Step 1: Accept the log input

The user may provide logs in one of two ways:
- **File upload** — one or more `.log`, `.txt`, or `.zip` files attached to the message
- **Pasted text** — raw log content typed or pasted directly in the chat

If files are uploaded, read them using the file reading tools. If a `.zip` is provided, unzip it
and read all `.log` or `.txt` files inside. If multiple files are provided, read all of them —
different components log to different files and combining them often reveals the full picture.

If the user hasn't provided any log content yet, ask them to upload or paste the log before proceeding.

## Step 2: Identify the log source

Before diving into analysis, determine what you're looking at:

**Client logs** (Windows or macOS v6.x) are typically found at:
- Windows: `%ProgramData%\Appgate\log\` → files like `appgate-service.log`, `appgate-client.log`
- macOS: `/Library/Logs/Appgate/` or `~/Library/Logs/Appgate/` → files like `appgate-service.log`
- They record: connection attempts, authentication events, tunnel creation, entitlement receipt,
  DNS handling, script execution, and client-side errors

**Gateway logs** (syslog or JSON) record: entitlement validation, policy enforcement,
session establishment/teardown, tunnel management, and resource access attempts

If you can't determine the source from the file name, look for distinguishing markers:
- Gateway logs typically contain fields like `gateway_id`, `session_id`, `entitlement_token`
- Client logs typically contain references to the local machine, user profile paths, or UI events

## Step 3: Parse the log format

Appgate logs come in two main flavors:

**Plain text / syslog format:**
```
[2024-11-15T14:23:01.412Z] Error : TLS handshake failed: certificate verify failed
[2024-11-15T14:23:01.413Z] Warn  : Retrying connection to controller (attempt 2/3)
[2024-11-15T14:23:04.001Z] Info  : loop_init, version 6.3.2-41200-release
```
Fields: `[ISO-8601 timestamp]` `Level` `:` `Message`

**JSON / structured format:**
```json
{"timestamp":"2024-11-15T14:23:01.412Z","level":"error","component":"tunnel","message":"handshake failed","peer":"gw1.example.com","reason":"CERTIFICATE_VERIFY_FAILED"}
```
Parse JSON objects line by line. Key fields: `timestamp`, `level`, `component`, `message`, `reason`, `peer`, `user`, `session_id`

When the format is mixed (some lines JSON, some plain text), handle each line according to its format.

## Step 4: Scan for known issue patterns

Work through the log systematically. Look for every `Error` and `Warn` level entry first, then
look for sequences of `Info` entries that indicate something *didn't* happen (e.g., authentication
started but no success confirmation follows). Cross-reference timestamps to identify cascading failures.

### Authentication Issues
**Signals:** `authentication failed`, `SAML assertion invalid`, `token expired`, `identity provider`,
`claims mismatch`, `MFA`, `certificate verify failed` in an auth context

**Common causes and fixes:**
- SAML IdP clock skew → check that the Controller's system clock is synced (NTP); SAML assertions
  are time-bound and typically expire within 5 minutes of issuance
- Expired user certificate → user needs to re-enroll or have cert renewed via the admin console
  (Admin Guide → Identity Providers → Certificate-based)
- Incorrect SAML attribute mapping → verify the attribute mapping in Admin Console → Identity
  Providers matches what the IdP is sending
- MFA timeout → user waited too long; they need to retry; if it happens frequently check the
  MFA timeout setting in the Identity Provider config

### TLS / Certificate Issues
**Signals:** `TLS handshake`, `certificate verify failed`, `CERTIFICATE_VERIFY_FAILED`,
`ssl`, `x509`, `cert`, `CA`, `self-signed`

**Common causes and fixes:**
- System clock skew on client → if clock is off by more than a few minutes, TLS validation fails;
  fix: sync the client clock (Windows: `w32tm /resync`, macOS: System Preferences → Date & Time)
- CA certificate not trusted → the Controller or Gateway's cert was signed by a CA that the client
  doesn't trust; fix: install the CA cert in the OS trust store, or use the Appgate-managed CA
  (Admin Guide → Certificates)
- Expired server certificate → admin must renew the certificate in Admin Console → Certificates
- Wrong hostname in cert (SNI mismatch) → verify the Controller URL in the client profile matches
  the CN/SAN in the certificate

### Connection / Tunnel Issues
**Signals:** `connect ENOENT`, `socket`, `connection refused`, `timeout`, `unreachable`,
`tunnel`, `handshake timeout`, `ETIMEDOUT`, `ECONNREFUSED`, `retry`

**Common causes and fixes:**
- Appgate service not running (Windows/macOS) → `connect ENOENT /run/user/.../appgate.service.sock`
  means the service daemon is down; fix: restart it (Windows: Services → Appgate SDP Service;
  macOS: `sudo launchctl start com.appgate.service`)
- Firewall blocking SPA (Single Packet Authorization) port → Appgate uses UDP port 4433 (default)
  for SPA; ensure this isn't blocked between client and Gateway
- Controller unreachable → network path issue; verify the client can reach the Controller's IP/hostname
  on TCP 443

### Entitlement / Policy Issues
**Signals:** `entitlement`, `policy`, `access denied`, `no matching entitlement`, `resource not found`,
`authorization failed`, `route`, `DNS`

**Common causes and fixes:**
- No DNS entitlement configured → if a user can connect but can't resolve internal hostnames, there
  is likely no Entitlement granting access to the internal DNS server; fix: add an IP-based Entitlement
  for the DNS server's IP address (Admin Guide → Entitlements)
- Policy condition not met → a Condition on the Entitlement evaluated to false (e.g., device posture
  check failed, time-of-day restriction, geolocation); check the Condition details in Admin Console →
  Policies → Conditions
- Entitlement token not received → the Controller issued no Entitlements for this user; check that
  the user is a member of the correct Group and that the Group is assigned to the correct Policy

### Gateway-Specific Issues
**Signals:** `gateway`, `session`, `entitlement_token`, `policy enforcement`, `tunnel teardown`,
`resource exhaustion`, `license`

**Common causes and fixes:**
- Session not established after SPA → SPA knock succeeded but tunnel didn't come up; check that
  the Gateway's public IP is reachable and UDP traffic can flow
- License limit exceeded → `license` + `limit` in logs means the deployment has hit its user or
  device cap; admin must check Admin Console → License and request an upgrade
- Gateway overloaded → high CPU/memory in Gateway logs combined with connection drops; consider
  adding a Gateway or enabling load balancing in the Site configuration

### Script / Claims Execution Issues
**Signals:** `script`, `on-demand claim`, `agwscapi`, `timeout`, `5000ms`, `execution failed`

**Common causes and fixes:**
- Script timeout → the on-demand claims script exceeded the 5000ms threshold; check that the
  script is lightweight; consider caching claims or optimizing the script logic
- Script execution error → review the script output in the log and check for syntax errors or
  missing dependencies in the script's environment

### Network Change / Adapter Issues (Windows)
**Signals:** `network change`, `TAP adapter`, `old IP`, `no new IP`, `interface`

**Common causes and fixes:**
- TAP adapter misidentified → some wireless managers misidentify the Appgate TAP adapter as a
  wired adapter; fix: exclude the Appgate adapter from the wireless manager's management scope
- IP change not applied → the client detected a network change but couldn't acquire a new IP;
  check adapter settings and driver version in Device Manager

## Step 5: Produce the analysis report

After scanning the full log, produce a structured report. Structure it as follows:

---
## Appgate Log Analysis

**Log source:** [Client – Windows/macOS | Gateway] | **Version:** [if visible] | **Time range:** [first to last timestamp]

### Issues Found

#### [Issue title — be specific, e.g., "TLS Certificate Verification Failure"]
- **Severity:** Critical / Warning / Informational
- **Evidence:** Quote the most relevant 1–3 log lines (exact text, with timestamps)
- **Root cause:** Plain English explanation of what went wrong and why
- **Recommended fix:** Step-by-step actions the user or admin should take, referencing the
  relevant section of Appgate's documentation where applicable

[Repeat for each distinct issue]

### No Issues Found
*Only include this section if no errors or warnings were found. Note what the log shows is working correctly.*

### Next Steps
A short prioritized list of what to do first, if there are multiple issues.
---

A few principles to keep the report useful:
- Quote exact log lines — don't paraphrase what the log says, show it
- Be specific about which component, user, timestamp, or session the issue affects
- If multiple issues are present, sort by severity (Critical → Warning → Informational)
- If the log is incomplete or truncated, say so and explain what additional log content would help

## References

When recommending fixes, refer users to these Appgate SDP v6.x official documentation sections:
- Troubleshooting access issues: `https://sdphelp.appgate.com/adminguide/v6.5/troubleshooting-access.html`
- Certificates: `https://sdphelp.appgate.com/adminguide/v6.5/certificates.html`
- Identity Providers: `https://sdphelp.appgate.com/adminguide/v6.5/identity-providers.html`
- Entitlements: `https://sdphelp.appgate.com/adminguide/v6.5/entitlements.html`
- Policies and Conditions: `https://sdphelp.appgate.com/adminguide/v6.5/policies.html`
- Gateways: `https://sdphelp.appgate.com/adminguide/v6.5/gateways.html`
- On-demand claims: `https://sdphelp.appgate.com/adminguide/v6.5/on-demand-claims.html`
