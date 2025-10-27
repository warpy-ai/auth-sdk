import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface TwoFactorEmailProps {
  code: string;
  appName?: string;
  companyName?: string;
  expirationMinutes?: number;
}

export function TwoFactorEmail({
  code,
  appName = "Auth SDK",
  companyName: _companyName = "Auth SDK",
  expirationMinutes = 5,
}: TwoFactorEmailProps) {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verification Code - {appName}</title>
      </Head>
      <Preview>Your verification code for {appName}</Preview>
      <Body style={main}>
        <Container style={outerContainer}>
          <Container style={container}>
            {/* Logo/Brand */}
            <Section style={logoSection}>
              <Heading style={logo}>{appName}</Heading>
            </Section>

            {/* Main Heading */}
            <Heading style={h1}>Verify Your Login</Heading>

            {/* Description */}
            <Text style={description}>
              {`Enter this verification code to complete your sign-in to ${appName}. This code will expire in ${expirationMinutes} minutes for your security.`}
            </Text>

            {/* Verification Code */}
            <Section style={codeContainer}>
              <Text style={codeText}>{code}</Text>
            </Section>

            {/* Security Notice */}
            <Section style={securitySection}>
              <Text style={securityText}>
                If you didn&apos;t request this code, someone may be trying to
                access your account. Please ignore this email and consider
                changing your password.
              </Text>
            </Section>

            {/* Footer */}
            <Section style={footerSection}>
              <Text style={footer}>
                Powered by{" "}
                <Link href="https://www.auth-sdk.dev/" style={footerLink}>
                  auth sdk @ warpy
                </Link>
              </Text>
            </Section>
          </Container>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  margin: "0",
  padding: "0",
  backgroundColor: "#000000",
  fontFamily: "'Courier New', Courier, monospace",
};

const outerContainer = {
  width: "100%",
  backgroundColor: "#000000",
  padding: "60px 20px",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "0 30px",
  textAlign: "center" as const,
};

const logoSection = {
  marginBottom: "50px",
};

const logo = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0",
  letterSpacing: "-0.5px",
};

const h1 = {
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "600",
  margin: "0 0 20px 0",
  lineHeight: "1.2",
  letterSpacing: "-0.5px",
};

const description = {
  color: "#888888",
  fontSize: "16px",
  margin: "0 0 40px 0",
  lineHeight: "1.6",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const codeContainer = {
  backgroundColor: "#0a0a0a",
  border: "2px solid #1a1a1a",
  borderRadius: "12px",
  padding: "40px 30px",
  margin: "40px 0",
  textAlign: "center" as const,
};

const codeText = {
  fontSize: "48px",
  fontWeight: "bold",
  color: "#ffffff",
  letterSpacing: "8px",
  fontFamily: "'Courier New', Courier, monospace",
  margin: "0",
  padding: "0",
};

const securitySection = {
  marginTop: "40px",
};

const securityText = {
  color: "#666666",
  fontSize: "13px",
  margin: "0",
  lineHeight: "1.6",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const footerSection = {
  padding: "50px 30px 30px 30px",
  textAlign: "center" as const,
};

const footer = {
  color: "#666666",
  fontSize: "13px",
  margin: "0",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const footerLink = {
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "500",
};

export default TwoFactorEmail;
