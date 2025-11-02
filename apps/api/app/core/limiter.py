from slowapi import Limiter
from slowapi.util import get_remote_address

# This function (key_func) tells the limiter to use the user's IP address
# to identify them.
limiter = Limiter(key_func=get_remote_address)