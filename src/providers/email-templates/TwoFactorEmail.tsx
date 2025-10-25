import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
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
  appName = "Your App",
  companyName = "Your Company",
  expirationMinutes = 5,
}: TwoFactorEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your verification code for {appName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Verify Your Login</Heading>
          <Text style={text}>
            Enter this verification code to complete your sign-in to {appName}.
            This code will expire in {expirationMinutes} minutes.
          </Text>
          <Section style={codeContainer}>
            <Text style={codeText}>{code}</Text>
          </Section>
          <Text style={text}>
            If you didn&apos;t request this code, someone may be trying to
            access your account. Please ignore this email and consider changing
            your password.
          </Text>
          <Text style={footer}>
            This code is for one-time use only and will expire after{" "}
            {expirationMinutes} minutes.
          </Text>
          <Text style={footer}>
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 48px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 48px",
};

const codeContainer = {
  backgroundColor: "#f6f9fc",
  borderRadius: "8px",
  padding: "32px 48px",
  margin: "32px 48px",
  textAlign: "center" as const,
  border: "2px dashed #e1e8ed",
};

const codeText = {
  fontSize: "48px",
  fontWeight: "bold",
  color: "#0070f3",
  letterSpacing: "8px",
  fontFamily: "monospace",
  margin: "0",
  padding: "0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 48px",
  marginTop: "20px",
};

export default TwoFactorEmail;
