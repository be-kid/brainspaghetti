import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";

export default function Header() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/"); // Redirect to home after logout
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" collapseOnSelect>
      <Container style={{ maxWidth: "80%", margin: "0 auto" }}>
        <LinkContainer to="/">
          <Navbar.Brand>
            <img
              src="/bs.png"
              alt="BrainSpaghetti 로고"
              style={{ height: "40px" }}
            />
          </Navbar.Brand>
        </LinkContainer>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* Main navigation links can go here if needed in the future */}
          </Nav>
          <Nav>
            {isLoggedIn && user ? (
              <NavDropdown
                title={
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      backgroundColor: "#4a148c",
                      borderRadius: "50%",
                      border: "2px solid #00bcd4",
                    }}
                  />
                }
                id="basic-nav-dropdown"
                align="end"
              >
                <LinkContainer to="/profile">
                  <NavDropdown.Item>프로필</NavDropdown.Item>
                </LinkContainer>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  로그아웃
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <LinkContainer to="/login">
                  <Nav.Link>로그인</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/signup">
                  <Nav.Link>회원가입</Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
