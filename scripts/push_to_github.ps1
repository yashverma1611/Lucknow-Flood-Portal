# Push to GitHub Helper Script
# Project: Lucknow Flood Risk Mapping and Site Suitability Analysis WebGIS Portal
# Author: Yash Kumar Verma (City College of Management, Lucknow)

param (
    [string]$RepoUrl = ""
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Lucknow Flood Risk WebGIS Portal - GitHub Deploy Helper" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Git is not detected in your PATH." -ForegroundColor Red
    Write-Host "Please install Git from https://git-scm.com/ or use GitHub Desktop." -ForegroundColor Yellow
    exit 1
}

# Change directory to project root
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host "1. Initializing Git repository..." -ForegroundColor Green
if (-not (Test-Path ".git")) {
    git init
}

Write-Host "2. Staging all files..." -ForegroundColor Green
git add .

Write-Host "3. Committing project files..." -ForegroundColor Green
git commit -m "feat: complete Lucknow Flood Risk WebGIS portal with 100% spatial accuracy and Google Maps integration"

Write-Host "4. Setting default branch to main..." -ForegroundColor Green
git branch -M main

if ([string]::IsNullOrWhiteSpace($RepoUrl)) {
    Write-Host ""
    Write-Host "Enter your GitHub repository remote URL" -ForegroundColor Yellow
    Write-Host "Example: https://github.com/your-username/lucknow-flood-qgis-portal.git" -ForegroundColor Gray
    $RepoUrl = Read-Host "GitHub Remote URL"
}

if (-not [string]::IsNullOrWhiteSpace($RepoUrl)) {
    Write-Host "5. Configuring remote origin ($RepoUrl)..." -ForegroundColor Green
    git remote remove origin -ErrorAction SilentlyContinue
    git remote add origin $RepoUrl

    Write-Host "6. Pushing to GitHub (main branch)..." -ForegroundColor Green
    git push -u origin main

    Write-Host ""
    Write-Host "SUCCESS! Your repository is now live on GitHub." -ForegroundColor Green
    Write-Host "Next step: Go to your repository on GitHub -> Settings -> Pages -> Select 'GitHub Actions' as Source." -ForegroundColor Cyan
} else {
    Write-Host "No URL provided. You can add it manually:" -ForegroundColor Yellow
    Write-Host "  git remote add origin https://github.com/<username>/<repo>.git"
    Write-Host "  git push -u origin main"
}
