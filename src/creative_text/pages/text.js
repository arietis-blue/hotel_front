import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Image, Spinner} from 'react-bootstrap';
import styled from 'styled-components';
import 'bootstrap/dist/css/bootstrap.min.css';

const StyledContainer = styled(Container)`
    margin-top: 50px;
`;

const TextView = () => {
    const [inputData, setInputData] = useState('');
    const [fontStyle, setFontStyle] = useState('851MkPOP_101.ttf');
    const [image, setOutputImage] = useState('');
    const [mask_image, setOutputMask] = useState('');
    const [prompt, setPrompt] = useState('');
    const [taskID, setTaskID] = useState(null);
    const [taskState, setTaskState] = useState(null);
    const [taskResult, setTaskResult] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.get('http://localhost:8000/ct/api/empty_text/', {
                params: {
                    input: inputData,
                    fontstyle: fontStyle
                }
            });
            setOutputImage(response.data.image);
            setOutputMask(response.data.mask_image);
        } catch (error) {
            console.error(error);
        }
    };

    const startTask = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.get('http://localhost:8000/ct/api/creative_text', {
                params: {
                    image: image,
                    mask: mask_image,
                    prompt: prompt
                }
            });
            console.log("task_started");
            setTaskID(response.data.task_id);
            setTaskState(null);
        } catch (error) {
            console.error(error);
        }
    };

    const pollTaskState = useCallback(async () => {
        console.log(taskID);
        if (taskID === null) {
            return;
        }

        try {
            const response = await axios.get('http://localhost:8000/ct/api/check_state', {
                params: {
                    task_id: taskID
                }
            });
            var data = response.data;
            console.log(data);
            setTaskState(data.state);
            if (data.state === 'READY') {
                setTaskResult(data.result);
            } else (
                setTaskState(taskState + " ")
            );
        } catch (error) {
            console.error(error);
        }
    }, [taskID, taskState, setTaskResult]);

    useEffect(() => {
        if (taskID !== null && taskState !== 'READY') {
            const timer = setTimeout(pollTaskState, 5000);
            return () => clearTimeout(timer);
        } 
    }, [taskID, taskState, pollTaskState]);

    return (
        <StyledContainer>
            <Form.Group>
                <Form.Control as="select" value={fontStyle} onChange={(e) => setFontStyle(e.target.value)}>
                    <option value="SourceHanSansJP-Regular.otf">源ノ角ゴシック</option>
                    <option value="SourceHanSerifJP-Regular.otf">源ノ明朝</option>
                    <option value="akabara-cinderella.ttf">赤薔薇シンデレラ</option>
                    <option value="851MkPOP_101.ttf">851マカポップ</option>
                </Form.Control>
            </Form.Group>
            <Form onSubmit={handleSubmit}>
                <Form.Group>
                    <Form.Control type="text" value={inputData} onChange={e => setInputData(e.target.value)} />
                </Form.Group>
                <Button type="submit">Submit</Button>
            </Form>
            <Row>
                <Col>
                    <Image src={`data:image/png;base64,${image}`} alt="Generated Text" fluid />
                </Col>
            </Row>
            <Form onSubmit={startTask}>
                <Form.Group>
                    <Form.Control type="text" value={prompt} onChange={e => setPrompt(e.target.value)} />
                </Form.Group>
                <Button type="submit">Generate Creative Text</Button>
            </Form>
            {taskID === null ? (
                <div>Please start the task by pressing the button.</div>
            ) : taskState === 'READY' ? (
                <div>
                    <div>Task result:</div>
                    <Image src={`data:image/png;base64,${taskResult}`} alt="Generated Text" fluid />
                </div>
            ) : (
                <div>
                    <Spinner animation="border" role="status">
                        <span className="sr-only"></span>
                    </Spinner>
                    <div>Loading</div>
                </div>
            )}
        </StyledContainer>
    );
};

export default TextView;
