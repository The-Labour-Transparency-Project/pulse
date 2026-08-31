using Amazon.S3;
using Amazon.SimpleEmail;
using Amazon;
using Amazon.Runtime;
using Api;
using Domain.Configuration;
using Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddPulseJson();

var awsOptions = builder.Configuration.GetAWSOptions();
var awsRegion = builder.Configuration["AWS_REGION"] ?? builder.Configuration["AWS_DEFAULT_REGION"];
if (!string.IsNullOrWhiteSpace(awsRegion))
{
    // Keep every AWS client, including SES, in the same region when running
    // against LocalStack or a non-default production region.
    awsOptions.Region = RegionEndpoint.GetBySystemName(awsRegion);
}
var localAwsServiceUrl = builder.Configuration["AWSServiceUrl"];
if (!string.IsNullOrWhiteSpace(localAwsServiceUrl))
{
    awsOptions.DefaultClientConfig.ServiceURL = localAwsServiceUrl;
}

builder.Services.AddDefaultAWSOptions(awsOptions);

var settings = PulseSettings.FromEnvironment(builder.Configuration);
builder.Services.AddPulseServices(settings);
builder.Services.AddCors(options => options.AddPolicy("PulseCors", policy =>
    policy.WithOrigins(settings.AllowedCorsOrigins).AllowAnyHeader().AllowAnyMethod()));
if (!string.IsNullOrWhiteSpace(localAwsServiceUrl))
{
    // LocalStack and MinIO use path-style addressing in local development.
    var accessKeyId = builder.Configuration["S3AccessKeyId"];
    var secretAccessKey = builder.Configuration["S3SecretAccessKey"];
    builder.Services.AddSingleton<IAmazonS3>(_ => new AmazonS3Client(
        string.IsNullOrWhiteSpace(accessKeyId) || string.IsNullOrWhiteSpace(secretAccessKey)
            ? FallbackCredentialsFactory.GetCredentials()
            : new BasicAWSCredentials(accessKeyId, secretAccessKey),
        new AmazonS3Config
    {
        ServiceURL = localAwsServiceUrl,
        ForcePathStyle = true,
    }));
}
else
{
    builder.Services.AddAWSService<IAmazonS3>();
}
if (settings.EmailProvider == PulseSettings.AwsEmailProvider)
{
    builder.Services.AddAWSService<IAmazonSimpleEmailService>();
}
builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);

var app = builder.Build();
app.UseHttpsRedirection();
app.UseCors("PulseCors");
app.Use(async (context, next) =>
{
    context.Response.Headers.CacheControl = "no-store";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    await next();
});
app.MapPulseEndpoints();
app.Run();

namespace Api
{
    public partial class Program
    {
    }
}
