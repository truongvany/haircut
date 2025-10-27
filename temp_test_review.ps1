$base = 'http://localhost/haircut/backend/public/api'

function PostJson($url, $body, $headers = @{}){
    $json = $body | ConvertTo-Json -Depth 10
    return Invoke-RestMethod -Method Post -Uri $url -Body $json -ContentType 'application/json' -Headers $headers
}
function Put($url, $body, $headers = @{}){
    $json = $body | ConvertTo-Json -Depth 10
    return Invoke-RestMethod -Method Put -Uri $url -Body $json -ContentType 'application/json' -Headers $headers
}
function GetJson($url, $headers = @{}){
    return Invoke-RestMethod -Method Get -Uri $url -Headers $headers
}

try{
        # Try login, if fails then register a new temp user and login
        Write-Host '1) Attempt login as guest@haircut.test...'
        try{
            $login = PostJson "$base/v1/auth/login" @{ email = 'guest@haircut.test'; password = 'secret123' }
            $token = $login.token
            Write-Host ' Logged in as guest@haircut.test'
        } catch {
            Write-Host ' login failed, registering a new temporary customer...'
            $ts = [int](Get-Date -UFormat %s)
            $email = "temp_test_$ts@haircut.test"
            $name = "Temp Test $ts"
            $pass = 'secret123'
            try{
                $reg = PostJson "$base/v1/auth/register" @{ full_name = $name; email = $email; password = $pass }
                Write-Host " Registered user $email"
            } catch {
                Write-Host ' Register possibly failed (maybe exists), will try login with $email'
            }
            # Attempt login with new email
            $login = PostJson "$base/v1/auth/login" @{ email = $email; password = $pass }
            $token = $login.token
            Write-Host " Logged in as $email"
        }
        if(-not $token){ Write-Host 'Login failed, no token'; exit 1 }
        Write-Host ' Token prefix:' ($token.Substring(0,20) + '...')
        $hdr = @{ Authorization = "Bearer $token" }

    Write-Host '2) Get salons...'
    $salons = GetJson "$base/v1/salons"
    $salon = $salons.items[0]
    if(-not $salon){ Write-Host 'No salon found'; exit 1 }
    Write-Host " Using salon id $($salon.id) - $($salon.name)"

    Write-Host '3) Get services for salon...'
    $sv = GetJson "$base/v1/salons/$($salon.id)/services"
    $service = $sv.items[0]
    if(-not $service){ Write-Host 'No service found'; exit 1 }
    Write-Host " Using service $($service.id) - $($service.name)"

    # appointment tomorrow at 10:00 (within typical salon hours)
    $d = (Get-Date).AddDays(1)
    $appt = $d.ToString('yyyy-MM-dd') + ' 10:00:00'
    Write-Host "4) Create booking at $appt"
    $create = PostJson "$base/v1/bookings" @{ salon_id = $salon.id; stylist_id = $null; appointment_at = $appt; items = @(@{ service_id = $service.id; qty = 1 }); note = 'Test booking for review' } $hdr
    Write-Host ' Create response:' ($create | ConvertTo-Json -Depth 5)
    $bookingId = $create.booking_id
    if(-not $bookingId){ Write-Host 'Booking create failed'; exit 1 }

    Write-Host "5) Confirm booking id $bookingId"
    $conf = Put "$base/v1/bookings/$bookingId/confirm" @{} $hdr
    Write-Host ' Confirm response:' ($conf | ConvertTo-Json -Depth 5)

    Write-Host "6) Complete booking id $bookingId"
    $comp = Put "$base/v1/bookings/$bookingId/complete" @{} $hdr
    Write-Host ' Complete response:' ($comp | ConvertTo-Json -Depth 5)

    Write-Host '7) Post review for booking'
    $post = PostJson "$base/v1/bookings/$bookingId/reviews" @{ rating = 5; comment = 'Automated test review' } $hdr
    Write-Host ' Post review response:' ($post | ConvertTo-Json -Depth 5)

    Write-Host '8) Fetch salon reviews to verify...'
    $rev = GetJson "$base/v1/salons/$($salon.id)/reviews"
    Write-Host ' Reviews count: ' $rev.items.Count
    $found = $rev.items | Where-Object { $_.booking_id -eq $bookingId }
    if($found){ Write-Host ' Found review:' ($found | ConvertTo-Json -Depth 5) } else { Write-Host ' Review not found in salon reviews' }

}catch{
    Write-Host 'Error:' $_.Exception.Message
}
