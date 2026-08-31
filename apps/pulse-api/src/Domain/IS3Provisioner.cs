namespace Domain;

public interface IS3Provisioner
{
    Task EnsureExists(CancellationToken cancellationToken = default);

    Task CheckAsync(CancellationToken cancellationToken = default);
}
