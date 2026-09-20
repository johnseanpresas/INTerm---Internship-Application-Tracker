export async function apiFetch(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> {
    const response = await fetch(input, {
        ...init,
        credentials: "include",
        cache: "no-store",
    })

    if (response.status === 401) {
        window.dispatchEvent(new Event("interm:session-expired"))
    }

    return response
}