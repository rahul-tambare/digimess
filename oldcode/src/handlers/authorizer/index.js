exports.handler = async (event) => {
  console.log("event", event);

  const token = event["authorizationToken"];

  console.log("token", token);

  let permission = "Deny";
  if (token === "asd5464rere") {
    permission = "Allow";
  }
  const authResponse = {
    principalId: "abc123",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Resource: [
            "arn:aws:execute-api:ap-south-1:020972273376:ilwzu1ciql/stage/*/*",
          ],
          Effect: `${permission}`,
        },
      ],
    },
  };
  return authResponse;
};
