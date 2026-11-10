using System.ComponentModel.DataAnnotations;

namespace PlaySlot.Application.Validation;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter | AttributeTargets.Field)]
public sealed class HttpsUrlAttribute : ValidationAttribute
{
    public HttpsUrlAttribute() : base("The field {0} must be an https:// URL.") { }

    public override bool IsValid(object? value)
    {
        if (value is null) return true;
        if (value is not string s) return false;
        if (s.Length == 0) return true;
        return Uri.TryCreate(s, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps;
    }
}
