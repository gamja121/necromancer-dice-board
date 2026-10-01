# Backup Cleanup Checklist

Updated: 2026-10-02

## Delete first later
- GitHub Actions temporary image backup artifacts
- GitHub Actions temporary full-project backup artifacts
- Older unsplit backup artifacts when a matching split backup already exists in Google Drive

## Keep in GitHub
- .github/workflows/image-backup.yml
- .github/workflows/drive-backup-export.yml
- Original game files and image assets

## Google Drive image ZIPs
KEEP FOR NOW.

Do not delete the 5 image backup ZIP parts until all individual images are verified.

Before deleting the Drive image ZIPs:
- Verify individual image count is 1,052
- Check sample files from the beginning, middle, and end
- Check for missing or duplicate filenames
- Confirm another complete backup still exists

## Google Drive full-project ZIPs
KEEP.

These are the persistent full-project backup copies.

## Cleanup order
1. Delete temporary GitHub Actions artifacts first
2. Keep workflow YAML files
3. Verify individual Drive images completely
4. Only then review Drive image ZIPs for deletion
5. Always keep at least one complete backup
