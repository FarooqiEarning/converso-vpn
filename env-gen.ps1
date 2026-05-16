Copy-Item .env .env.bak

function New-HexSecret($bytes = 32) {
    -join ((1..($bytes * 2)) | ForEach-Object {
        "{0:x}" -f (Get-Random -Maximum 16)
    })
}

function New-Base64Secret($bytes = 32) {
    [Convert]::ToBase64String((1..$bytes | ForEach-Object {
        Get-Random -Maximum 256
    }))
}

$envContent = Get-Content .env -Raw

$envContent = $envContent -replace 'GENERATE_64_CHAR_RANDOM_SECRET_ACCESS', (New-HexSecret)
$envContent = $envContent -replace 'GENERATE_64_CHAR_RANDOM_SECRET_REFRESH', (New-HexSecret)
$envContent = $envContent -replace 'GENERATE_64_CHAR_RANDOM_SECRET_NEXTAUTH', (New-HexSecret)
$envContent = $envContent -replace 'GENERATE_STRONG_SECRET_FOR_AGENTS', (New-HexSecret)
$envContent = $envContent -replace 'GENERATE_32_BYTE_AES_KEY_BASE64', (New-Base64Secret)
$envContent = $envContent -replace 'STRONG_GRAFANA_PASSWORD', (New-HexSecret 16)

Set-Content .env $envContent

Write-Host "✅ .env secrets generated successfully"