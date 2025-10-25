# Disable pager temporarily
$env:GIT_PAGER = ""

# Check if northstar branch exists on remote
$remoteBranches = git branch -r
$northstarExists = $remoteBranches | Select-String "northstar"

if ($northstarExists) {
    Write-Host "Found northstar branch on remote, checking it out..."
    git checkout -b northstar origin/northstar
} else {
    Write-Host "Creating new northstar branch..."
    git checkout -b northstar
}

# Merge main into northstar
git merge main -m "Merge main into northstar - React chunk splitting fix"

# Push northstar branch
git push origin northstar

Write-Host "Done! Northstar branch is now up to date with main."
