import styled from "styled-components";

export const Table = styled.table`
  width: 100%;
  line-height: 1.4;
  margin: 3rem 0;
  color: ${p => p.theme.textColorSecondary};
  font-size: 1.6rem;

  thead th {
    color: ${p => p.theme.textColor};
    border-bottom: 2px solid ${p => p.theme.borderColor};
    font-weight: 600;
  }

  th,
  td {
    padding: 5px;
    text-align: left;
  }

  th:first-child,
  td:first-child {
    text-align: left;
    padding-left: 0;
  }
  th:last-child,
  td:last-child {
    padding-right: 0;
  }
`;

export default Table;
