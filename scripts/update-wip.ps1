Write-Host "Switching to wip..."
git checkout wip

Write-Host "Fetching origin..."
git fetch origin

Write-Host "Merging main..."
git merge origin/main

Write-Host "Keeping local changes..."
git checkout --ours .

Write-Host "Rebuilding site..."
npm run build

Write-Host "Adding files..."
git add .

Write-Host "Creating merge commit..."
git commit -m "Resolve merge conflicts keeping wip changes"

Write-Host "Pushing..."
git push

Write-Host "Done!"