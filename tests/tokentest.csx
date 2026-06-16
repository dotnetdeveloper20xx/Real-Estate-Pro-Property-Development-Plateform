using System;
using System.IdentityModel.Tokens.Jwt;
using System.Collections.Generic;
using System.Text;
using Microsoft.IdentityModel.Tokens;

var claims = new Dictionary<string, object>
{
    [""sub""] = ""user-123"",
    [""jti""] = Guid.NewGuid().ToString(),
    [""email""] = ""test@example.com"",
    [""full_name""] = ""John Doe"",
    [""role""] = new List<string> { ""Admin"", ""SuperAdmin"" }
};

var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(""ThisIsAVeryLongSecretKeyForTestingPurposes12345678!""));
var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

var descriptor = new SecurityTokenDescriptor
{
    Claims = claims,
    Expires = DateTime.UtcNow.AddMinutes(60),
    Issuer = ""Test"",
    Audience = ""TestAud"",
    SigningCredentials = creds
};

var handler = new JwtSecurityTokenHandler();
var token = handler.CreateToken(descriptor);
var tokenString = handler.WriteToken(token);

handler.InboundClaimTypeMap.Clear();
var jwt = handler.ReadJwtToken(tokenString);

Console.WriteLine(""Payload keys: "" + string.Join("", "", jwt.Payload.Keys));
Console.WriteLine(""full_name in payload: "" + jwt.Payload.ContainsKey(""full_name""));
if (jwt.Payload.ContainsKey(""full_name""))
    Console.WriteLine(""full_name value: "" + jwt.Payload[""full_name""]);

foreach (var c in jwt.Claims)
{
    Console.WriteLine($""Claim: {c.Type} = {c.Value}"");
}
