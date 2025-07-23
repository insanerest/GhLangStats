async function getTokenOwner(token) {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if(res.ok){
    console.log(res.ok)
    const { login } = await res.json();
    return login;
  }
}

module.exports = getTokenOwner