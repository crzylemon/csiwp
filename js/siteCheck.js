/**
 * check if site is running on an authorized hostname
 * @returns {boolean}
 */
export function siteCheck() { // change if your an actual modder and not some slop site :)
    if (window.location.hash.includes("bad")) {
        return false;
    }
    return window.location.hostname.includes("crz.network") || window.location.hostname.includes("ngrok-free.dev") || window.location.hostname.includes("localhost");
}
